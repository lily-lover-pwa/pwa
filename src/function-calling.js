// --- 共通ヘルパー関数 ---


/**
 * キャラクター名を正規化（統一形式に変換）するヘルパー関数
 * @param {string} name - 正規化するキャラクター名
 * @returns {string} 正規化されたキャラクター名
 */
 function normalizeCharacterName(name) {
    if (typeof name !== 'string') return '';
    return name
        .trim() // 前後の空白を削除
        .replace(/\s+/g, ' ') // 連続する空白を半角スペース1つに統一
        .replace(/･/g, '・');
}
// app.js（別モジュール）からも参照されるため window に公開する
window.normalizeCharacterName = normalizeCharacterName;


/**
 * 物語の根幹をなす重要な設定（世界の法則、登場人物の秘密、事件の犯人など）、後から参照すべき情報を永続的に記憶・管理します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "add", "delete", "list" のいずれか
 * @param {string} [args.key] - 操作対象のキー (add, delete時に必須)
 * @param {string} [args.value] - 保存する値 (add時に必須)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_persistent_memory({ action, key, value }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memory = chat.persistentMemory;
      let resultData = null;
      switch (action) {
          case "add":
              if (!key || value === undefined) return { error: "addアクションには 'key' と 'value' が必要です。" };
              memory[key] = value;
              resultData = { success: true, message: `キー「${key}」に値を保存しました。` };
              break;
          case "delete":
              if (!key) return { error: "deleteアクションには 'key' が必要です。" };
              if (key in memory) {
                  delete memory[key];
                  resultData = { success: true, message: `キー「${key}」を削除しました。` };
              } else {
                  resultData = { success: false, message: `キー「${key}」は見つかりませんでした。` };
              }
              break;
          case "list": {
              const keys = Object.keys(memory);
              resultData = { success: true, count: keys.length, keys: keys };
              break;
          }
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      console.log(`[Function Calling] 処理完了:`, resultData);
      return resultData;
  } catch (error) {
      console.error(`[Function Calling] manage_persistent_memoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 現在の日付と時刻をJST（日本標準時）で取得する関数
 * @returns {Promise<object>} JSTの日付、曜日、時刻を含むオブジェクトを返すPromise
 */
async function getCurrentDateTime() {
    console.log(`[Function Calling] getCurrentDateTimeが呼び出されました。`);
    try {
        const options = {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        const formatter = new Intl.DateTimeFormat('ja-JP', options);
        const parts = formatter.formatToParts(new Date());

        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const weekday = parts.find(p => p.type === 'weekday').value;
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;
        const second = parts.find(p => p.type === 'second').value;

        const result = {
            date: `${year}年${month}月${day}日`,
            weekday: weekday,
            time: `${hour}:${minute}:${second}`,
            timezone: "JST (UTC+9)"
        };

        console.log(`[Function Calling] getCurrentDateTime: 取得結果:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] getCurrentDateTimeでエラーが発生しました:`, error);
        return { error: `時刻の取得中にエラーが発生しました: ${error.message}` };
    }
}

/**
 * TRPGなどで使用するダイスロールを実行する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.expression - ダイスロールの式 (例: "2d6", "1d100+5")
 * @returns {Promise<object>} ダイスロールの結果詳細を含むオブジェクトを返すPromise
 */
async function rollDice({ expression }) {
    console.log(`[Function Calling] rollDiceが呼び出されました。式: ${expression}`);

    const diceRegex = /^(?<count>\d+)d(?<sides>\d+)(?:(?<modifier_op>[+-])(?<modifier_val>\d+))?$/i;
    const match = expression.trim().match(diceRegex);

    if (!match) {
        const errorMsg = "無効なダイス形式です。「(個数)d(面数)+(補正値)」の形式で指定してください。(例: 1d6, 2d10+5)";
        console.error(`[Function Calling] rollDice: ${errorMsg}`);
        return { error: errorMsg };
    }

    const { count, sides, modifier_op, modifier_val } = match.groups;
    const numCount = parseInt(count, 10);
    const numSides = parseInt(sides, 10);
    const numModifier = modifier_val ? parseInt(modifier_val, 10) : 0;

    if (numCount < 1 || numCount > 100) {
        return { error: "ダイスの個数は1個から100個までです。" };
    }
    if (numSides < 1 || numSides > 1000) {
        return { error: "ダイスの面数は1面から1000面までです。" };
    }
    if (numModifier > 10000) {
        return { error: "補正値は10000までです。" };
    }

    try {
        const rolls = [];
        let sum = 0;
        for (let i = 0; i < numCount; i++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
            sum += roll;
        }

        let total = sum;
        if (modifier_op === '+') {
            total += numModifier;
        } else if (modifier_op === '-') {
            total -= numModifier;
        }

        const result = {
            expression: expression,
            rolls: rolls,
            sum: sum,
            modifier: modifier_op ? `${modifier_op}${numModifier}` : "なし",
            total: total
        };

        console.log(`[Function Calling] rollDice: 実行結果:`, result);
        return result;

    } catch (error) {
        console.error(`[Function Calling] rollDiceで予期せぬエラー:`, error);
        return { error: `ダイスロール中に予期せぬエラーが発生しました: ${error.message}` };
    }
}

/**
 * タイマーを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "start", "check", "stop" のいずれか
 * @param {string} args.timer_name - タイマーを識別するための一意の名前
 * @param {number} [args.duration_minutes] - タイマーの期間（分単位）。startアクションで必須
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_timer({ action, timer_name, duration_minutes }) {
    console.log(`[Function Calling] manage_timerが呼び出されました。`, { action, timer_name, duration_minutes });

    if (!timer_name) {
        return { error: "タイマー名(timer_name)は必須です。" };
    }

    switch (action) {
        case "start":
            if (typeof duration_minutes !== 'number' || duration_minutes <= 0) {
                return { error: "タイマーを開始するには、0より大きい分数(duration_minutes)が必要です。" };
            }
            return window.appLogic.timerManager.start(timer_name, duration_minutes);

        case "check":
            return window.appLogic.timerManager.check(timer_name);

        case "stop":
            return window.appLogic.timerManager.stop(timer_name);

        default:
            return { error: `無効なアクションです: ${action}` };
    }
}

/**
 * キャラクターのステータス（HP, MPなど）を設定、増減します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_name - 操作対象のキャラクター名
 * @param {string} args.action - "set", "increase", "decrease" のいずれか
 * @param {string} args.status_key - 操作対象のステータス名 (例: "HP", "MP")
 * @param {number} [args.value] - "set", "increase", "decrease" アクションで使用する数値
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_character_status({ character_name, action, status_key, value }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_character_statusが呼び出されました。`, { character_name, action, status_key, value });
  if (!character_name || !action || !status_key) return { error: "引数 'character_name', 'action', 'status_key' は必須です。" };
  if (["set", "increase", "decrease"].includes(action) && typeof value !== 'number') return { error: `アクション '${action}' には数値型の 'value' が必要です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memoryKey = `character_${character_name}`;
      if (!chat.persistentMemory[memoryKey]) chat.persistentMemory[memoryKey] = {};
      const characterStatus = chat.persistentMemory[memoryKey];
      let currentValue = characterStatus[status_key] || 0;
      let newValue;
      let message;
      switch (action) {
          case "set":
              newValue = value;
              message = `${character_name}の${status_key}を${newValue}に設定しました。`;
              break;
          case "increase":
              newValue = currentValue + value;
              message = `${character_name}の${status_key}が${value}上昇し、${newValue}になりました。`;
              break;
          case "decrease":
              newValue = currentValue - value;
              message = `${character_name}の${status_key}が${value}減少し、${newValue}になりました。`;
              break;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      characterStatus[status_key] = newValue;
      const result = { success: true, character_name, status_key, old_value: currentValue, new_value: newValue, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_character_statusでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * キャラクターの所持品を追加、削除します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.character_name - 操作対象のキャラクター名
 * @param {string} args.action - "add", "remove" のいずれか
 * @param {string} args.item_name - 操作対象のアイテム名
 * @param {number} [args.quantity=1] - "add", "remove" アクションで使用する個数 (デフォルト1)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_inventory({ character_name, action, item_name, quantity = 1 }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_inventoryが呼び出されました。`, { character_name, action, item_name, quantity });
  if (!character_name || !action || !item_name) return { error: "引数 'character_name', 'action', 'item_name' は必須です。" };
  if (["add", "remove"].includes(action) && (typeof quantity !== 'number' || quantity <= 0)) return { error: `アクション '${action}' には1以上の数値型の 'quantity' が必要です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!chat.persistentMemory.inventories) chat.persistentMemory.inventories = {};
      const inventories = chat.persistentMemory.inventories;
      if (!inventories[character_name]) inventories[character_name] = {};
      const characterInventory = inventories[character_name];
      const currentQuantity = characterInventory[item_name] || 0;
      let message;
      switch (action) {
          case "add": {
              const newQuantityAdd = currentQuantity + quantity;
              characterInventory[item_name] = newQuantityAdd;
              message = `${character_name}は「${item_name}」を${quantity}個手に入れた。(所持数: ${newQuantityAdd})`;
              break;
          }
          case "remove": {
              const removedAmount = Math.min(currentQuantity, quantity);
              if (removedAmount === 0) {
                  message = `${character_name}は「${item_name}」を持っていないため使えなかった。`;
                  return { success: true, message: message, removed_quantity: 0 };
              }
              const newQuantityRemove = currentQuantity - removedAmount;
              if (newQuantityRemove > 0) {
                  characterInventory[item_name] = newQuantityRemove;
              } else {
                  delete characterInventory[item_name];
              }
              message = (removedAmount < quantity)
                  ? `${character_name}は「${item_name}」を${removedAmount}個しか持っていなかったため、全て使った。(残り: 0)`
                  : `${character_name}は「${item_name}」を${removedAmount}個使った。(残り: ${newQuantityRemove})`;
              break;
          }
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      const result = { success: true, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_inventoryでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 物語のシーン（場所、時間、雰囲気など）を管理します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "push", "pop" のいずれか
 * @param {string} [args.scene_id] - シーンを識別するための一意のID
 * @param {string} [args.location] - 場所名
 * @param {string} [args.time_of_day] - 時間帯 ("morning", "noon", "evening", "night")
 * @param {string} [args.mood] - 雰囲気 ("sweet", "calm", "tense", "dark"など)
 * @param {string} [args.pov] - 視点 ("first", "third")
 * @param {string} [args.notes] - その他のメモ
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_scene(args, chat) { // chat引数を追加
  const { action, ...scene_details } = args;
  console.log(`[Function Calling] manage_sceneが呼び出されました。`, args);
  if (!action) return { error: "引数 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!Array.isArray(chat.persistentMemory.scene_stack)) chat.persistentMemory.scene_stack = [{ scene_id: "initial", location: "不明な場所" }];
      const scene_stack = chat.persistentMemory.scene_stack;
      let message;
      let currentScene = scene_stack[scene_stack.length - 1];
      switch (action) {
          case "set":
              Object.keys(scene_details).forEach(key => {
                  if (scene_details[key] !== undefined) currentScene[key] = scene_details[key];
              });
              message = `シーン情報を更新しました。現在の場所: ${currentScene.location || '未設定'}`;
              break;
          case "push": {
              const newScene = { ...currentScene, ...scene_details };
              scene_stack.push(newScene);
              message = `新しいシーン「${newScene.location || '新しい場所'}」に移行しました。`;
              break;
          }
          case "pop": {
              if (scene_stack.length <= 1) return { error: "これ以上前のシーンに戻ることはできません。" };
              const poppedScene = scene_stack.pop();
              currentScene = scene_stack[scene_stack.length - 1];
              message = `シーン「${poppedScene.location || '前の場所'}」から「${currentScene.location || '現在の場所'}」に戻りました。`;
              break;
          }
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      const finalCurrentScene = scene_stack[scene_stack.length - 1];
      const result = { success: true, current_scene: finalCurrentScene, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_sceneでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 物語のフラグやカウンターを管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "toggle", "increase", "decrease", "delete" のいずれか
 * @param {string} args.key - フラグを識別するための一意のキー
 * @param {boolean|number} [args.value] - "set", "increase", "decrease" で使用する値
 * @param {number} [args.ttl_minutes] - フラグが自動的に消滅するまでの時間（分単位）
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_flags({ action, key, value, ttl_minutes }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_flagsが呼び出されました。`, { action, key, value, ttl_minutes });
  if (!key || !action) return { error: "引数 'key' と 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memory = chat.persistentMemory;
      let currentValue = memory[key];
      let newValue;
      let message;
      switch (action) {
          case "set":
              if (value === undefined) return { error: "アクション 'set' には 'value' が必要です。" };
              newValue = value;
              message = `フラグ「${key}」を「${newValue}」に設定しました。`;
              break;
          case "toggle":
              newValue = !(currentValue === true);
              message = `フラグ「${key}」を「${newValue}」に切り替えました。`;
              break;
          case "increase":
              if (typeof value !== 'number') return { error: "アクション 'increase' には数値型の 'value' が必要です。" };
              currentValue = typeof currentValue === 'number' ? currentValue : 0;
              newValue = currentValue + value;
              message = `カウンター「${key}」が${value}増加し、「${newValue}」になりました。`;
              break;
          case "decrease":
              if (typeof value !== 'number') return { error: "アクション 'decrease' には数値型の 'value' が必要です。" };
              currentValue = typeof currentValue === 'number' ? currentValue : 0;
              newValue = currentValue - value;
              message = `カウンター「${key}」が${value}減少し、「${newValue}」になりました。`;
              break;
          case "delete":
              if (key in memory) {
                  delete memory[key];
                  message = `フラグ「${key}」を削除しました。`;
              } else {
                  return { success: false, message: `フラグ「${key}」は存在しません。` };
              }
              break;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      if (newValue !== undefined) memory[key] = newValue;
      if (typeof ttl_minutes === 'number' && ttl_minutes > 0) {
          // TTLの処理はDB保存と分離するため、ここではメッセージ追加のみ
          message += ` (${ttl_minutes}分後に自動消滅します)`;
      }
      const result = { success: true, key, old_value: currentValue, new_value: newValue, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_flagsでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * ゲーム内の経過日数を管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "pass_days" のいずれか
 * @param {number} [args.days=1] - "pass_days" アクションで経過させる日数 (デフォルト1)
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_game_date({ action, days = 1 }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_game_dateが呼び出されました。`, { action, days });
  if (!action) return { error: "引数 'action' は必須です。" };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (typeof chat.persistentMemory.game_day !== 'number') chat.persistentMemory.game_day = 1;
      let currentDay = chat.persistentMemory.game_day;
      let message;
      switch (action) {
          case "pass_days":
              if (typeof days !== 'number' || days < 1 || !Number.isInteger(days)) return { error: "経過させる日数(days)は1以上の整数である必要があります。" };
              currentDay += days;
              chat.persistentMemory.game_day = currentDay;
              message = `${days}日が経過し、${currentDay}日目になりました。`;
              break;
          default:
              return { error: `無効なアクションです: ${action}` };
      }
      const result = { success: true, current_day: currentDay, message };
      console.log(`[Function Calling] 処理完了:`, result);
      return result;
  } catch (error) {
      console.error(`[Function Calling] manage_game_dateでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * 指定された範囲内のランダムな整数を生成します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {number} args.min - 乱数の最小値 (整数)
 * @param {number} args.max - 乱数の最大値 (整数)
 * @param {number} [args.count=1] - 生成する乱数の個数 (デフォルト1)
 * @returns {Promise<object>} 生成された整数の配列を含むオブジェクトを返すPromise
 */
async function get_random_integer({ min, max, count = 1 }) {
    console.log(`[Function Calling] get_random_integerが呼び出されました。`, { min, max, count });

    if (typeof min !== 'number' || typeof max !== 'number' || !Number.isInteger(min) || !Number.isInteger(max)) {
        return { error: "引数 'min' と 'max' は整数である必要があります。" };
    }
    if (min > max) {
        return { error: "引数 'min' は 'max' 以下である必要があります。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に生成できる個数は100個までです。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            results.push(randomNumber);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] get_random_integerでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 提供されたリストの中からランダムに項目を選択します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {Array<any>} args.list - 選択肢となる配列
 * @param {number} [args.count=1] - 選択する項目の個数 (デフォルト1、重複を許す)
 * @returns {Promise<object>} 選択された項目の配列を含むオブジェクトを返すPromise
 */
async function get_random_choice({ list, count = 1 }) {
    console.log(`[Function Calling] get_random_choiceが呼び出されました。`, { list, count });

    if (!Array.isArray(list) || list.length === 0) {
        return { error: "引数 'list' は空でない配列である必要があります。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に選択できる個数は100個までです。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * list.length);
            results.push(list[randomIndex]);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] get_random_choiceでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 指定された条件でランダムな文字列を生成します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {number} args.length - 生成する文字列の長さ
 * @param {number} [args.count=1] - 生成する文字列の個数 (デフォルト1)
 * @param {boolean} [args.use_uppercase=true] - 大文字英字を使用するか
 * @param {boolean} [args.use_lowercase=true] - 小文字英字を使用するか
 * @param {boolean} [args.use_numbers=true] - 数字を使用するか
 * @param {boolean} [args.use_symbols=false] - 記号を使用するか
 * @returns {Promise<object>} 生成された文字列の配列を含むオブジェクトを返すPromise
 */
async function generate_random_string({ length, count = 1, use_uppercase = true, use_lowercase = true, use_numbers = true, use_symbols = false }) {
    console.log(`[Function Calling] generate_random_stringが呼び出されました。`, { length, count, use_uppercase, use_lowercase, use_numbers, use_symbols });

    if (typeof length !== 'number' || !Number.isInteger(length) || length < 1) {
        return { error: "引数 'length' は1以上の整数である必要があります。" };
    }
    if (length > 128) {
        return { error: "一度に生成できる文字列の長さは128文字までです。" };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
        return { error: "一度に生成できる個数は100個までです。" };
    }

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charSet = '';
    if (use_uppercase) charSet += upper;
    if (use_lowercase) charSet += lower;
    if (use_numbers) charSet += numbers;
    if (use_symbols) charSet += symbols;

    if (charSet.length === 0) {
        return { error: "少なくとも1種類の文字セット（大文字、小文字、数字、記号）を有効にする必要があります。" };
    }

    try {
        const results = [];
        for (let i = 0; i < count; i++) {
            let randomString = '';
            for (let j = 0; j < length; j++) {
                const randomIndex = Math.floor(Math.random() * charSet.length);
                randomString += charSet[randomIndex];
            }
            results.push(randomString);
        }
        return { success: true, results: results };
    } catch (error) {
        console.error(`[Function Calling] generate_random_stringでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * Google Custom Search APIを使用してWeb検索を実行し、結果の要約を返します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.query - 検索キーワードまたは質問文
 * @returns {Promise<object>} 検索結果の要約またはエラー情報を含むオブジェクトを返すPromise
 */
async function search_web({ query }) {
    console.log(`[Function Calling] search_webが呼び出されました。`, { query });
  
    const apiKey = window.state.settings.googleSearchApiKey;
    const engineId = window.state.settings.googleSearchEngineId;
  
    if (!apiKey || !engineId) {
        return { error: "Web検索機能を利用するには、設定画面でGoogle Search APIキーと検索エンジンIDの両方を設定する必要があります。" };
    }
    if (!query) {
        return { error: "検索クエリ(query)は必須です。" };
    }
  
    const endpoint = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}`;
  
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTPエラー: ${response.status}`;
            console.error(`[Function Calling] search_web APIエラー:`, errorMessage);
            return { error: `Web検索APIでエラーが発生しました: ${errorMessage}` };
        }
  
        const data = await response.json();
  
        if (!data.items || data.items.length === 0) {
            return { success: true, summary: "検索結果が見つかりませんでした。", search_results: [] };
        }
  
        const results = data.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
  
        // AI向けのプレーンテキスト要約を作成
        let summary = `Web検索結果の要約:\n\n`;
        results.forEach((result, index) => {
            summary += `[${index + 1}] ${result.title}\n`;
            summary += `抜粋: ${result.snippet}\n`;
            summary += `URL: ${result.link}\n\n`;
        });
  
        // AI向けの要約と、UI向けのリンク配列の両方を返す
        return { success: true, summary: summary.trim(), search_results: results };
  
    } catch (error) {
        console.error(`[Function Calling] search_webで予期せぬエラー:`, error);
        return { error: `Web検索中に予期せぬエラーが発生しました: ${error.message}` };
    }
}

/**
 * キャラクターの口調や一人称などのスタイルプロファイルを設定します。
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.action - "set", "list" のいずれか
 * @param {string} [args.character_name] - 操作対象のキャラクター名
 * @param {string} [args.profile_name] - "set"アクションで適用する定義済みプリセット名
 * @param {object} [args.overrides] - "set"アクションでプリセットの一部を上書きする設定
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
async function manage_style_profile({ action, character_name, profile_name, overrides }, chat) { // chat引数を追加
  console.log(`[Function Calling] manage_style_profileが呼び出されました。`, { action, character_name, profile_name, overrides });
  const STYLE_PRESETS = {
      "polite": { first_person: "私", politeness: 0.8, sentence_ender: "です,ます", dialect: "standard", description: "丁寧語" },
      "casual": { first_person: "俺", politeness: 0.3, sentence_ender: "だ,だよ", dialect: "standard", description: "カジュアル" },
      "tsundere": { first_person: "アタシ", politeness: 0.6, sentence_ender: "なんだからね！", dialect: "standard", description: "ツンデレ" },
      "merchant": { first_person: "あっし", politeness: 0.7, sentence_ender: "でさぁ,まっせ", dialect: "merchant_speak", description: "商人" },
      "noble_male": { first_person: "私", politeness: 0.9, sentence_ender: "である,かね", dialect: "noble", description: "貴族男性" },
      "noble_female": { first_person: "わたくし", politeness: 0.9, sentence_ender: "ですわ,ますのよ", dialect: "noble", description: "貴族女性（お嬢様）" },
      "samurai": { first_person: "拙者", politeness: 0.7, sentence_ender: "である,ござる", dialect: "samurai", description: "武士" },
      "kansai": { first_person: "ウチ", politeness: 0.4, sentence_ender: "やで,やんか", dialect: "kansai", description: "関西弁" },
      "neutral_narration": { first_person: null, politeness: 0.5, sentence_ender: "だ,である", dialect: "standard", description: "地の文（三人称中立）" },
  };
  if (!action) return { error: "引数 'action' は必須です。" };
  if (["set"].includes(action) && !character_name) return { error: `アクション '${action}' には 'character_name' が必須です。` };
  try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (!chat.persistentMemory.style_profiles) chat.persistentMemory.style_profiles = {};
      const profiles = chat.persistentMemory.style_profiles;
      switch (action) {
          case "set": {
              let baseProfile = {};
              if (profile_name) {
                  if (!STYLE_PRESETS[profile_name]) return { error: `指定されたプリセット名 '${profile_name}' は存在しません。` };
                  baseProfile = { ...STYLE_PRESETS[profile_name] };
              } else {
                  baseProfile = profiles[character_name] ? { ...profiles[character_name] } : {};
              }
              const finalProfile = { ...baseProfile, ...overrides, profile_name: profile_name || baseProfile.profile_name || "custom" };
              profiles[character_name] = finalProfile;
              return { success: true, message: `${character_name}の口調プロファイルを更新しました。`, profile: finalProfile };
          }
          case "list": {
              return { success: true, available_presets: STYLE_PRESETS };
          }
          default:
              return { error: `無効なアクションです: ${action}` };
      }
  } catch (error) {
      console.error(`[Function Calling] manage_style_profileでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
  }
}

/**
 * キャラクターの記憶、関係性、状態を統合的に管理する関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @returns {Promise<object>} 操作結果を含むオブジェクトを返すPromise
 */
 async function manage_character_memory(args, chat) {
    const {
        character_name,
        action,
        status,
        current_location,
        summary,
        short_term_goal,
        relationship_target,
        relationship_affinity,
        relationship_context
    } = args;

    console.log(`[Function Calling] manage_character_memoryが呼び出されました。`, args);

    if (!character_name || !action) {
        return { error: "引数 'character_name' と 'action' は必須です。" };
    }

    try {
        if (!chat.persistentMemory) chat.persistentMemory = {};
        
        const normalizedCharName = normalizeCharacterName(character_name);
        const memoryKey = `character_memory_${normalizedCharName}`;

        // persistentMemory内をループして、正規化後の名前が一致する既存のキーを探す
        let existingKey = null;
        for (const key in chat.persistentMemory) {
            if (key.startsWith('character_memory_')) {
                const existingName = key.replace('character_memory_', '');
                if (normalizeCharacterName(existingName) === normalizedCharName) {
                    existingKey = key;
                    break;
                }
            }
        }
        
        const finalMemoryKey = existingKey || memoryKey;

        switch (action) {
            case "update": {
                // 既存のデータを取得するか、なければ新規作成する
                const memory = chat.persistentMemory[finalMemoryKey] || {};

                // 各キーを上書き
                if (status !== undefined) memory.status = status;
                if (current_location !== undefined) memory.current_location = current_location;
                if (summary !== undefined) memory.summary = summary;
                if (short_term_goal !== undefined) memory.short_term_goal = short_term_goal;

                // 関係性の処理
                if (relationship_target) {
                    if (!memory.relationships) memory.relationships = {};
                    
                    const normalizedTargetName = normalizeCharacterName(relationship_target);
                    if (!memory.relationships[normalizedTargetName]) memory.relationships[normalizedTargetName] = {};
                    
                    const targetRelation = memory.relationships[normalizedTargetName];

                    if (relationship_affinity !== undefined) {
                        targetRelation.affinity = relationship_affinity;
                    }
                    if (relationship_context !== undefined && String(relationship_context).trim() !== '') {
                        if (targetRelation.context) {
                            targetRelation.context += `\n${relationship_context}`;
                        } else {
                            targetRelation.context = relationship_context;
                        }
                    }
                }
                
                // 最終的なキーでデータを保存
                chat.persistentMemory[finalMemoryKey] = memory;
                
                return { success: true, message: `キャラクター「${character_name}」の記憶を更新しました。`, updated_memory: memory };
            }

            case "delete": {
                if (chat.persistentMemory[finalMemoryKey]) {
                    delete chat.persistentMemory[finalMemoryKey];
                    return { success: true, message: `キャラクター「${character_name}」の記憶を削除しました。` };
                } else {
                    return { success: false, message: `キャラクター「${character_name}」の記憶は存在しません。` };
                }
            }

            default:
                return { error: `無効なアクションです: ${action}` };
        }
    } catch (error) {
        console.error(`[Function Calling] manage_character_memoryでエラーが発生しました:`, error);
        return { error: `内部エラーが発生しました: ${error.message}` };
    }
}

/**
 * 指定されたURLのコンテンツを取得するプロキシ経由の関数
 * @param {object} args - AIによって提供される引数オブジェクト
 * @param {string} args.url - 取得したいコンテンツのURL
 * @returns {Promise<object>} 取得したテキストコンテンツまたはエラー情報
 */
 async function fetch_url_content({ url }) {
    console.log(`[Function Calling] fetch_url_contentが呼び出されました。URL: ${url}`);

    const PROXY_URL = 'https://gemini-pwa-mk2-proxy.marine14f.workers.dev/';

    if (!PROXY_URL.startsWith('https://')) {
        // デプロイ忘れの際にエラーメッセージを返す
        return { error: "プロキシURLが設定されていません。この機能は現在利用できません。" };
    }
    if (!url) {
        return { error: "引数 'url' は必須です。" };
    }

    try {
        // WorkerにPOSTリクエストでURLを渡す
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`プロキシサーバーからのエラー (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            return { error: `コンテンツの取得に失敗しました: ${data.error}` };
        }

        console.log(`[Function Calling] fetch_url_content: ${data.content.substring(0, 200)}...`);
        return { success: true, content: data.content };

    } catch (error) {
        console.error(`[Function Calling] fetch_url_contentでエラーが発生しました:`, error);
        return { error: `URLコンテンツの取得中にエラーが発生しました: ${error.message}` };
    }
}




window.functionCallingTools = {
  calculate: async function({ expression }) {
    console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const allowedChars = /^[0-9+\-*/().\s]+$/;
    if (!allowedChars.test(expression)) {
      console.error("[Function Calling] calculate: 式に許可されていない文字が含まれています。");
      return { error: "無効な式です。四則演算と括弧のみ使用できます。" };
    }

    try {
      const result = new Function(`return ${expression}`)();
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error("計算結果が無効です。");
      }
      console.log(`[Function Calling] calculate: 計算結果: ${result}`);
      return { result: result };
    } catch (error) {
      console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
      return { error: `計算エラー: ${error.message}` };
    }
    },
    manage_persistent_memory: manage_persistent_memory,
    getCurrentDateTime: getCurrentDateTime,
    rollDice: rollDice,
    manage_timer: manage_timer,
    manage_character_status: manage_character_status,
    manage_inventory: manage_inventory,
    manage_scene: manage_scene,
    manage_flags: manage_flags,
    manage_game_date: manage_game_date,
    get_random_integer: get_random_integer,
    get_random_choice: get_random_choice,
    generate_random_string: generate_random_string,
    search_web: search_web,
    manage_style_profile: manage_style_profile,
    manage_character_memory: manage_character_memory,
    fetch_url_content: fetch_url_content,
    generate_image_novelai: async function(args) {
        return await window.appLogic.handleNovelAIGeneration(args);
    }
};


/**
* AIに提供するツールの定義情報 (Tool Declaration)
*/
window.functionDeclarations = [
    {
        "function_declarations": [
          {
                "name": "calculate",
                "description": "ユーザーから与えられた数学的な計算式（四則演算）を評価し、その正確な結果を返します。複雑な計算や、信頼性が求められる計算の場合に必ず使用してください。",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "expression": {
                            "type": "STRING",
                            "description": "計算する数式。例: '2 * (3 + 5)'"
                        }
                    },
                    "required": ["expression"]
                }
            },
            {
                "name": "manage_persistent_memory",
                "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。物語の根幹をなす重要な設定（世界の法則、登場人物の秘密、事件の犯人など）、後から参照すべき情報を永続的に記憶・管理します。記録された情報はAPI送信時に自動的にプロンプトに含まれます。",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "action": {
                            "type": "STRING",
                            "description": "実行する操作を選択します。'add': 情報を追加/上書き, 'delete': 情報を削除, 'list': 記憶している全ての情報キーを一覧表示。"
                        },
                        "key": {
                            "type": "STRING",
                            "description": "情報を識別するための一意のキー（名前）。'add', 'delete' アクションで必須です。例: '世界の法則', '犯人の名前'"
                        },
                        "value": {
                            "type": "STRING",
                            "description": "キーに紐付けて記憶させる情報の内容。'add' アクションで必須です。例: 'この世界では魔法は使えない', '田中 太郎'"
                        }
                    },
                    "required": ["action"]
                }
            },
            {
              "name": "getCurrentDateTime",
              "description": "現実世界の現在の日付と時刻（日本時間）を取得します。この情報を利用することで、ユーザーとの会話がより現実的で没入感のあるものになる場合にのみ使用してください。会話の文脈を慎重に判断し、ロールプレイの世界観を壊すなど、不自然になる場合は絶対に使用しないでください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {},
                  "required": []
              }
            },
            {
              "name": "rollDice",
              "description": "テーブルトークRPG（TRPG）やボードゲームなどで使用される、指定された形式のダイスを振って結果を返します。ユーザーが「1d100」や「2d6+3」のように、明確にダイスロールを要求した場合にのみ使用してください。一般的な確率計算には `get_random_integer` を使用してください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "expression": {
                          "type": "STRING",
                          "description": "ダイスロールの式。XdY+Z (X=個数, Y=面数, Z=補正値) の形式。例: '1d100', '2d6+5', '3d8-2'"
                      }
                  },
                  "required": ["expression"]
              }
            },
            {
              "name": "manage_timer",
              "description": "指定した時間（分単位）でタイマーを設定、確認、停止します。時間制限のあるイベントや、一定時間後の応答をシミュレートするのに使用します。タイマーが時間切れになると、AIにその事実が通知されます。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'start': タイマーを開始, 'check': 残り時間を確認, 'stop': タイマーを停止。"
                      },
                      "timer_name": {
                          "type": "STRING",
                          "description": "タイマーを識別するための一意の名前。例: '爆弾解除タイマー', '返信待ちタイマー'"
                      },
                      "duration_minutes": {
                          "type": "NUMBER",
                          "description": "'start'アクション時に設定するタイマーの期間（分単位）。例: 5"
                      }
                  },
                  "required": ["action", "timer_name"]
              }
            },
            {
              "name": "manage_character_status",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。ロールプレイングゲームや物語に登場するキャラクターのステータス（HP, MP, 疲労度など、キャラクター単体で完結するパラメータ）を設定、増減します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "character_name": {
                          "type": "STRING",
                          "description": "操作対象のキャラクターの名前。例: '主人公', 'ヒロインA'"
                      },
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'set': 値を直接設定, 'increase': 値を増加, 'decrease': 値を減少。"
                      },
                      "status_key": {
                          "type": "STRING",
                          "description": "操作対象のステータスの種類。例: 'HP', 'MP', '疲労度'"
                      },
                      "value": {
                          "type": "NUMBER",
                          "description": "'set', 'increase', 'decrease' アクションで使用する数値。例: 10"
                      }
                  },
                  "required": ["character_name", "action", "status_key"]
              }
            },
            {
              "name": "manage_inventory",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。キャラクターの所持品（アイテム）を追加、削除します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "character_name": {
                          "type": "STRING",
                          "description": "操作対象のキャラクターの名前。例: '主人公'"
                      },
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'add': アイテムを追加, 'remove': アイテムを削除/消費。"
                      },
                      "item_name": {
                          "type": "STRING",
                          "description": "操作対象のアイテムの名前。例: '薬草', 'ポーション'"
                      },
                      "quantity": {
                          "type": "NUMBER",
                          "description": "'add'または'remove'アクションで使用するアイテムの個数。指定がない場合は1として扱われます。"
                      }
                  },
                  "required": ["character_name", "action", "item_name"]
              }
            },
            {
              "name": "manage_scene",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。物語の場面設定（場所、時間帯、雰囲気、視点など）を管理します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'set': 現在のシーン情報を部分的に更新する。'push': 新しいシーンに移行する（前のシーンは記憶される）。'pop': 一つ前のシーンに戻る。"
                      },
                      "scene_id": {
                          "type": "STRING",
                          "description": "シーンを識別するための一意のID。後で参照する場合などに使用します。"
                      },
                      "location": {
                          "type": "STRING",
                          "description": "場面の場所。例: '薄暗い酒場', '王城の謁見の間'"
                      },
                      "time_of_day": {
                          "type": "STRING",
                          "description": "場面の時間帯。'morning', 'noon', 'evening', 'night' から選択します。"
                      },
                      "mood": {
                          "type": "STRING",
                          "description": "場面の雰囲気。例: 'sweet'(甘い), 'calm'(穏やか), 'tense'(緊迫), 'dark'(不穏), 'comical'(滑稽)"
                      },
                      "pov": {
                          "type": "STRING",
                          "description": "物語の視点。'first'(一人称), 'third'(三人称) から選択します。"
                      },
                      "notes": {
                          "type": "STRING",
                          "description": "シーンに関するその他の補足情報。例: '外は土砂降りの雨が降っている'"
                      }
                  },
                  "required": ["action"]
              }
            },
            {
              "name": "manage_flags",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。物語の進行状況や世界の状況を示すフラグ（真偽値）やカウンター（数値）を管理します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'set': 値を直接設定。'toggle': 真偽値を反転させる。'increase': 数値を増やす。'decrease': 数値を減らす。'delete': フラグ自体を削除。"
                      },
                      "key": {
                          "type": "STRING",
                          "description": "フラグやカウンターを識別するための一意の名前。例: '扉A解錠済', '街の警戒度'"
                      },
                      "value": {
                          "type": "STRING", 
                          "description": "'set', 'increase', 'decrease' アクションで使用する値 (真偽値または数値)。文字列として渡してください。"
                      },
                      "ttl_minutes": {
                          "type": "NUMBER",
                          "description": "フラグが自動的に削除されるまでの時間（分単位）。一時的な状態を表現するのに使います。"
                      }
                  },
                  "required": ["action", "key"]
              }
            },
            {
              "name": "manage_game_date",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。物語やゲーム内の経過日数を管理します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'pass_days': 指定した日数だけ日付を進める。"
                      },
                      "days": {
                          "type": "NUMBER",
                          "description": "'pass_days'アクションで使用する経過日数。指定がない場合は1として扱われます。"
                      }
                  },
                  "required": ["action"]
              }
            },
            {
              "name": "get_random_integer",
              "description": "指定された最小値と最大値の範囲内で、ランダムな整数を生成します。『50%の確率』や『1から10までのランダムな数字』など、一般的な確率計算や数値のランダム化が必要な場合に使用してください。TRPGのダイスロール（例: '2d6'）の場合は、代わりに `rollDice` 関数を使用してください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "min": {
                          "type": "NUMBER",
                          "description": "生成される乱数の最小値（この値も含まれる）。"
                      },
                      "max": {
                          "type": "NUMBER",
                          "description": "生成される乱数の最大値（この値も含まれる）。"
                      },
                      "count": {
                          "type": "NUMBER",
                          "description": "生成する乱数の個数。指定しない場合は1。"
                      }
                  },
                  "required": ["min", "max"]
              }
            },
            {
              "name": "get_random_choice",
              "description": "提供されたリストの中から、ランダムに一つまたは複数の項目を選択します。くじ引き、ガチャ、ランダムなアイテムの選択、登場人物の行動のランダム決定などに使用してください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "list": {
                          "type": "ARRAY",
                          "description": "選択肢となる項目を含む配列。例: ['リンゴ', 'バナナ', 'オレンジ']",
                          "items": { "type": "STRING" }
                      },
                      "count": {
                          "type": "NUMBER",
                          "description": "選択する項目の個数（重複選択を許す）。指定しない場合は1。"
                      }
                  },
                  "required": ["list"]
              }
            },
            {
              "name": "generate_random_string",
              "description": "指定された条件に基づいて、ランダムな文字列（パスワード、シリアルナンバー、IDなど）を生成します。物語の中で、意味を持たないユニークな文字列や、機械的に生成されたようなコードが必要な場合に使用してください。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "length": {
                          "type": "NUMBER",
                          "description": "生成する文字列の長さ。"
                      },
                      "count": {
                          "type": "NUMBER",
                          "description": "生成する文字列の個数。指定しない場合は1。"
                      },
                      "use_uppercase": {
                          "type": "BOOLEAN",
                          "description": "大文字の英字（A-Z）を含めるか。デフォルトはtrue。"
                      },
                      "use_lowercase": {
                          "type": "BOOLEAN",
                          "description": "小文字の英字（a-z）を含めるか。デフォルトはtrue。"
                      },
                      "use_numbers": {
                          "type": "BOOLEAN",
                          "description": "数字（0-9）を含めるか。デフォルトはtrue。"
                      },
                      "use_symbols": {
                          "type": "BOOLEAN",
                          "description": "記号（!@#$...など）を含めるか。デフォルトはfalse。"
                      }
                  },
                  "required": ["length"]
              }
            },
            {
              "name": "search_web",
              "description": "AI自身の知識にない、現実世界の最新情報、特定の専門知識、あるいは具体的なデータが必要な場合に使用します。物語のリアリティを高めるための情報収集に役立ちます。例えば、歴史的な出来事、特定の場所の天気、科学的な事実などを調べるのに使ってください。この関数を使用するにはユーザーによるAPIの設定が必要です。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "query": {
                          "type": "STRING",
                          "description": "検索したいキーワードや質問文。具体的で明確なクエリを指定してください。例: '日本の城下町の発展の歴史', '今日の東京の天気'"
                      }
                  },
                  "required": ["query"]
              }
            },
            {
              "name": "manage_style_profile",
              "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。キャラクターの口調、一人称、方言などの話し方のスタイルを設定します。",
              "parameters": {
                  "type": "OBJECT",
                  "properties": {
                      "action": {
                          "type": "STRING",
                          "description": "実行する操作。'set': キャラクターの口調を設定/変更する。'list': 利用可能な口調プリセットの一覧を表示する。"
                      },
                      "character_name": {
                          "type": "STRING",
                          "description": "'set'で操作対象となるキャラクター名。地の文を操作する場合は '地の文' と指定します。"
                      },
                      "profile_name": {
                          "type": "STRING",
                          "description": "'set'アクションで使用する、定義済みの口調プリセット名。'list'アクションで利用可能なプリセットを確認できます。例: 'polite', 'casual', 'tsundere'"
                      },
                      "overrides": {
                          "type": "OBJECT",
                          "description": "'set'アクションで使用し、プリセットの一部だけを上書きするためのオブジェクト。例: {'first_person': 'ボク'} は一人称だけを'ボク'に変更します。",
                          "properties": {
                              "first_person": { "type": "STRING", "description": "一人称。例: '私', '俺', 'ボク'" },
                              "politeness": { "type": "NUMBER", "description": "丁寧さの度合い (0.0から1.0)。0.0が最もくだけており、1.0が最も丁寧。" },
                              "sentence_ender": { "type": "STRING", "description": "特徴的な語尾や言い回し。例: '～だぜ', '～ですわ'" },
                              "dialect": { "type": "STRING", "description": "方言や特定の話し方。例: 'kansai', 'samurai'" }
                          }
                      }
                  },
                  "required": ["action"]
              }
            },
        {
            "name": "manage_character_memory",
            "description": "【重要】ユーザーの指示や許可が無い場合、本関数をモデルの判断で勝手に使用することは禁止します。ロールプレイングゲームや物語に登場するキャラクターの記憶や人格の一貫性を維持するための情報を管理します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "character_name": {
                        "type": "STRING",
                        "description": "操作対象のキャラクターの名前。"
                    },
                    "action": {
                        "type": "STRING",
                        "description": "実行する操作を選択します。'update': 記憶を更新, 'delete': 記憶を削除。"
                    },
                    "status": {
                        "type": "STRING",
                        "description": "キャラクターの生死や健康状態を更新する場合に指定します。例: '生存', '死亡', '負傷'"
                    },
                    "current_location": {
                        "type": "STRING",
                        "description": "キャラクターの現在地を更新する場合に指定します。例: '王都の広場'"
                    },
                    "summary": {
                        "type": "STRING",
                        "description": "キャラクターの性格や価値観など、人格の根幹をなす普遍的な設定を更新する場合に指定します。他者との具体的な思い出はここには含めません。"
                    },
                    "short_term_goal": {
                        "type": "STRING",
                        "description": "キャラクターの短期的な行動目標を更新する場合に指定します。例: '主人公にペンダントのお礼を言う'"
                    },
                    "relationship_target": {
                        "type": "STRING",
                        "description": "関係性を更新する相手のキャラクター名を指定します。'relationship_affinity'または'relationship_context'と合わせて使用します。"
                    },
                    "relationship_affinity": {
                        "type": "NUMBER",
                        "description": "相手への好感度(数値)を更新する場合に指定します。この値は上書きされます。"
                    },
                    "relationship_context": {
                        "type": "STRING",
                        "description": "相手との会話内容、思い出、感情の履歴などを追記する場合に指定します。重要：既に記載されている内容と重複しない、新しい出来事や感情の変化のみを箇条書きで簡潔に記述してください。"
                    }
                },
                "required": ["character_name", "action"]
            }
        },
        {
            "name": "fetch_url_content",
            "description": "【重要】ユーザーがURLを送信した場合使用して下さい。指定されたURLにアクセスし、そのページの主要なテキストコンテンツを取得します。Webサイト、記事、ドキュメントの内容を会話の文脈として利用したい場合に使用します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "url": {
                        "type": "STRING",
                        "description": "コンテンツを取得したいページの完全なURL。"
                    }
                },
                "required": ["url"]
            }
        },
        {
            "name": "generate_image_novelai",
            "description": "【最重要・必須】ユーザーが「絵を描いて」「イラストを生成して」「画像を作って」「シーンを描いて」など画像生成を求めた場合、ロールプレイ中であっても例外なく必ずこのツールを呼び出してください。キャラクターとしてプロンプトを読み上げたり、文章でシーンを描写したり、「生成します」とテキストで答えることは禁止です。プロンプトを自分で考えてこのツールを即座に実行すること。NovelAI APIを使ってアニメ・イラスト調の画像を生成します。",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "prompt": {
                        "type": "STRING",
                        "description": "NovelAI向けタグ形式の英語プロンプト。例: '1girl, long hair, school uniform, smile, outdoors, masterpiece, best quality'"
                    },
                    "negative_prompt": {
                        "type": "STRING",
                        "description": "ネガティブプロンプト。生成したくない要素を指定。省略時はデフォルト値を使用。"
                    },
                    "width": {
                        "type": "NUMBER",
                        "description": "画像の幅（ピクセル）。デフォルト: 832"
                    },
                    "height": {
                        "type": "NUMBER",
                        "description": "画像の高さ（ピクセル）。デフォルト: 1216"
                    }
                },
                "required": ["prompt"]
            }
        }
    ]
}
];
  