/* このファイルは src/ から生成された自動生成物です。直接編集せず src/ を編集して `npm run build` を実行してください。 */
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/function-calling.js
  function normalizeCharacterName(name) {
    if (typeof name !== "string") return "";
    return name.trim().replace(/\s+/g, " ").replace(/･/g, "・");
  }
  __name(normalizeCharacterName, "normalizeCharacterName");
  window.normalizeCharacterName = normalizeCharacterName;
  async function manage_persistent_memory({ action, key, value }, chat) {
    console.log(`[Function Calling] manage_persistent_memoryが呼び出されました。`, { action, key, value });
    try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      const memory = chat.persistentMemory;
      let resultData = null;
      switch (action) {
        case "add":
          if (!key || value === void 0) return { error: "addアクションには 'key' と 'value' が必要です。" };
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
          resultData = { success: true, count: keys.length, keys };
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
  __name(manage_persistent_memory, "manage_persistent_memory");
  async function getCurrentDateTime() {
    console.log(`[Function Calling] getCurrentDateTimeが呼び出されました。`);
    try {
      const options = {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat("ja-JP", options);
      const parts = formatter.formatToParts(/* @__PURE__ */ new Date());
      const year = parts.find((p) => p.type === "year").value;
      const month = parts.find((p) => p.type === "month").value;
      const day = parts.find((p) => p.type === "day").value;
      const weekday = parts.find((p) => p.type === "weekday").value;
      const hour = parts.find((p) => p.type === "hour").value;
      const minute = parts.find((p) => p.type === "minute").value;
      const second = parts.find((p) => p.type === "second").value;
      const result = {
        date: `${year}年${month}月${day}日`,
        weekday,
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
  __name(getCurrentDateTime, "getCurrentDateTime");
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
    if (numSides < 1 || numSides > 1e3) {
      return { error: "ダイスの面数は1面から1000面までです。" };
    }
    if (numModifier > 1e4) {
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
      if (modifier_op === "+") {
        total += numModifier;
      } else if (modifier_op === "-") {
        total -= numModifier;
      }
      const result = {
        expression,
        rolls,
        sum,
        modifier: modifier_op ? `${modifier_op}${numModifier}` : "なし",
        total
      };
      console.log(`[Function Calling] rollDice: 実行結果:`, result);
      return result;
    } catch (error) {
      console.error(`[Function Calling] rollDiceで予期せぬエラー:`, error);
      return { error: `ダイスロール中に予期せぬエラーが発生しました: ${error.message}` };
    }
  }
  __name(rollDice, "rollDice");
  async function manage_timer({ action, timer_name, duration_minutes }) {
    console.log(`[Function Calling] manage_timerが呼び出されました。`, { action, timer_name, duration_minutes });
    if (!timer_name) {
      return { error: "タイマー名(timer_name)は必須です。" };
    }
    switch (action) {
      case "start":
        if (typeof duration_minutes !== "number" || duration_minutes <= 0) {
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
  __name(manage_timer, "manage_timer");
  async function manage_character_status({ character_name, action, status_key, value }, chat) {
    console.log(`[Function Calling] manage_character_statusが呼び出されました。`, { character_name, action, status_key, value });
    if (!character_name || !action || !status_key) return { error: "引数 'character_name', 'action', 'status_key' は必須です。" };
    if (["set", "increase", "decrease"].includes(action) && typeof value !== "number") return { error: `アクション '${action}' には数値型の 'value' が必要です。` };
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
  __name(manage_character_status, "manage_character_status");
  async function manage_inventory({ character_name, action, item_name, quantity = 1 }, chat) {
    console.log(`[Function Calling] manage_inventoryが呼び出されました。`, { character_name, action, item_name, quantity });
    if (!character_name || !action || !item_name) return { error: "引数 'character_name', 'action', 'item_name' は必須です。" };
    if (["add", "remove"].includes(action) && (typeof quantity !== "number" || quantity <= 0)) return { error: `アクション '${action}' には1以上の数値型の 'quantity' が必要です。` };
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
            return { success: true, message, removed_quantity: 0 };
          }
          const newQuantityRemove = currentQuantity - removedAmount;
          if (newQuantityRemove > 0) {
            characterInventory[item_name] = newQuantityRemove;
          } else {
            delete characterInventory[item_name];
          }
          message = removedAmount < quantity ? `${character_name}は「${item_name}」を${removedAmount}個しか持っていなかったため、全て使った。(残り: 0)` : `${character_name}は「${item_name}」を${removedAmount}個使った。(残り: ${newQuantityRemove})`;
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
  __name(manage_inventory, "manage_inventory");
  async function manage_scene(args, chat) {
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
          Object.keys(scene_details).forEach((key) => {
            if (scene_details[key] !== void 0) currentScene[key] = scene_details[key];
          });
          message = `シーン情報を更新しました。現在の場所: ${currentScene.location || "未設定"}`;
          break;
        case "push": {
          const newScene = { ...currentScene, ...scene_details };
          scene_stack.push(newScene);
          message = `新しいシーン「${newScene.location || "新しい場所"}」に移行しました。`;
          break;
        }
        case "pop": {
          if (scene_stack.length <= 1) return { error: "これ以上前のシーンに戻ることはできません。" };
          const poppedScene = scene_stack.pop();
          currentScene = scene_stack[scene_stack.length - 1];
          message = `シーン「${poppedScene.location || "前の場所"}」から「${currentScene.location || "現在の場所"}」に戻りました。`;
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
  __name(manage_scene, "manage_scene");
  async function manage_flags({ action, key, value, ttl_minutes }, chat) {
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
          if (value === void 0) return { error: "アクション 'set' には 'value' が必要です。" };
          newValue = value;
          message = `フラグ「${key}」を「${newValue}」に設定しました。`;
          break;
        case "toggle":
          newValue = !(currentValue === true);
          message = `フラグ「${key}」を「${newValue}」に切り替えました。`;
          break;
        case "increase":
          if (typeof value !== "number") return { error: "アクション 'increase' には数値型の 'value' が必要です。" };
          currentValue = typeof currentValue === "number" ? currentValue : 0;
          newValue = currentValue + value;
          message = `カウンター「${key}」が${value}増加し、「${newValue}」になりました。`;
          break;
        case "decrease":
          if (typeof value !== "number") return { error: "アクション 'decrease' には数値型の 'value' が必要です。" };
          currentValue = typeof currentValue === "number" ? currentValue : 0;
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
      if (newValue !== void 0) memory[key] = newValue;
      if (typeof ttl_minutes === "number" && ttl_minutes > 0) {
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
  __name(manage_flags, "manage_flags");
  async function manage_game_date({ action, days = 1 }, chat) {
    console.log(`[Function Calling] manage_game_dateが呼び出されました。`, { action, days });
    if (!action) return { error: "引数 'action' は必須です。" };
    try {
      if (!chat.persistentMemory) chat.persistentMemory = {};
      if (typeof chat.persistentMemory.game_day !== "number") chat.persistentMemory.game_day = 1;
      let currentDay = chat.persistentMemory.game_day;
      let message;
      switch (action) {
        case "pass_days":
          if (typeof days !== "number" || days < 1 || !Number.isInteger(days)) return { error: "経過させる日数(days)は1以上の整数である必要があります。" };
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
  __name(manage_game_date, "manage_game_date");
  async function get_random_integer({ min, max, count = 1 }) {
    console.log(`[Function Calling] get_random_integerが呼び出されました。`, { min, max, count });
    if (typeof min !== "number" || typeof max !== "number" || !Number.isInteger(min) || !Number.isInteger(max)) {
      return { error: "引数 'min' と 'max' は整数である必要があります。" };
    }
    if (min > max) {
      return { error: "引数 'min' は 'max' 以下である必要があります。" };
    }
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
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
      return { success: true, results };
    } catch (error) {
      console.error(`[Function Calling] get_random_integerでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
    }
  }
  __name(get_random_integer, "get_random_integer");
  async function get_random_choice({ list, count = 1 }) {
    console.log(`[Function Calling] get_random_choiceが呼び出されました。`, { list, count });
    if (!Array.isArray(list) || list.length === 0) {
      return { error: "引数 'list' は空でない配列である必要があります。" };
    }
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
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
      return { success: true, results };
    } catch (error) {
      console.error(`[Function Calling] get_random_choiceでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
    }
  }
  __name(get_random_choice, "get_random_choice");
  async function generate_random_string({ length, count = 1, use_uppercase = true, use_lowercase = true, use_numbers = true, use_symbols = false }) {
    console.log(`[Function Calling] generate_random_stringが呼び出されました。`, { length, count, use_uppercase, use_lowercase, use_numbers, use_symbols });
    if (typeof length !== "number" || !Number.isInteger(length) || length < 1) {
      return { error: "引数 'length' は1以上の整数である必要があります。" };
    }
    if (length > 128) {
      return { error: "一度に生成できる文字列の長さは128文字までです。" };
    }
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) {
      return { error: "引数 'count' は1以上の整数である必要があります。" };
    }
    if (count > 100) {
      return { error: "一度に生成できる個数は100個までです。" };
    }
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let charSet = "";
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
        let randomString = "";
        for (let j = 0; j < length; j++) {
          const randomIndex = Math.floor(Math.random() * charSet.length);
          randomString += charSet[randomIndex];
        }
        results.push(randomString);
      }
      return { success: true, results };
    } catch (error) {
      console.error(`[Function Calling] generate_random_stringでエラーが発生しました:`, error);
      return { error: `内部エラーが発生しました: ${error.message}` };
    }
  }
  __name(generate_random_string, "generate_random_string");
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
      const results = data.items.slice(0, 5).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      }));
      let summary = `Web検索結果の要約:

`;
      results.forEach((result, index) => {
        summary += `[${index + 1}] ${result.title}
`;
        summary += `抜粋: ${result.snippet}
`;
        summary += `URL: ${result.link}

`;
      });
      return { success: true, summary: summary.trim(), search_results: results };
    } catch (error) {
      console.error(`[Function Calling] search_webで予期せぬエラー:`, error);
      return { error: `Web検索中に予期せぬエラーが発生しました: ${error.message}` };
    }
  }
  __name(search_web, "search_web");
  async function manage_style_profile({ action, character_name, profile_name, overrides }, chat) {
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
      "neutral_narration": { first_person: null, politeness: 0.5, sentence_ender: "だ,である", dialect: "standard", description: "地の文（三人称中立）" }
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
  __name(manage_style_profile, "manage_style_profile");
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
      let existingKey = null;
      for (const key in chat.persistentMemory) {
        if (key.startsWith("character_memory_")) {
          const existingName = key.replace("character_memory_", "");
          if (normalizeCharacterName(existingName) === normalizedCharName) {
            existingKey = key;
            break;
          }
        }
      }
      const finalMemoryKey = existingKey || memoryKey;
      switch (action) {
        case "update": {
          const memory = chat.persistentMemory[finalMemoryKey] || {};
          if (status !== void 0) memory.status = status;
          if (current_location !== void 0) memory.current_location = current_location;
          if (summary !== void 0) memory.summary = summary;
          if (short_term_goal !== void 0) memory.short_term_goal = short_term_goal;
          if (relationship_target) {
            if (!memory.relationships) memory.relationships = {};
            const normalizedTargetName = normalizeCharacterName(relationship_target);
            if (!memory.relationships[normalizedTargetName]) memory.relationships[normalizedTargetName] = {};
            const targetRelation = memory.relationships[normalizedTargetName];
            if (relationship_affinity !== void 0) {
              targetRelation.affinity = relationship_affinity;
            }
            if (relationship_context !== void 0 && String(relationship_context).trim() !== "") {
              if (targetRelation.context) {
                targetRelation.context += `
${relationship_context}`;
              } else {
                targetRelation.context = relationship_context;
              }
            }
          }
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
  __name(manage_character_memory, "manage_character_memory");
  async function fetch_url_content({ url }) {
    console.log(`[Function Calling] fetch_url_contentが呼び出されました。URL: ${url}`);
    const PROXY_URL = "https://gemini-pwa-mk2-proxy.marine14f.workers.dev/";
    if (!PROXY_URL.startsWith("https://")) {
      return { error: "プロキシURLが設定されていません。この機能は現在利用できません。" };
    }
    if (!url) {
      return { error: "引数 'url' は必須です。" };
    }
    try {
      const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
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
  __name(fetch_url_content, "fetch_url_content");
  window.functionCallingTools = {
    calculate: /* @__PURE__ */ __name(async function({ expression }) {
      console.log(`[Function Calling] calculateが呼び出されました。式: ${expression}`);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const allowedChars = /^[0-9+\-*/().\s]+$/;
      if (!allowedChars.test(expression)) {
        console.error("[Function Calling] calculate: 式に許可されていない文字が含まれています。");
        return { error: "無効な式です。四則演算と括弧のみ使用できます。" };
      }
      try {
        const result = new Function(`return ${expression}`)();
        if (typeof result !== "number" || !isFinite(result)) {
          throw new Error("計算結果が無効です。");
        }
        console.log(`[Function Calling] calculate: 計算結果: ${result}`);
        return { result };
      } catch (error) {
        console.error(`[Function Calling] calculate: 計算エラー: ${error.message}`);
        return { error: `計算エラー: ${error.message}` };
      }
    }, "calculate"),
    manage_persistent_memory,
    getCurrentDateTime,
    rollDice,
    manage_timer,
    manage_character_status,
    manage_inventory,
    manage_scene,
    manage_flags,
    manage_game_date,
    get_random_integer,
    get_random_choice,
    generate_random_string,
    search_web,
    manage_style_profile,
    manage_character_memory,
    fetch_url_content,
    generate_image_novelai: /* @__PURE__ */ __name(async function(args) {
      return await window.appLogic.handleNovelAIGeneration(args);
    }, "generate_image_novelai")
  };
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

  // src/dropbox.js
  window.dropboxApi = {
    APP_KEY: "nb8btcpivs6ba9u",
    METADATA_PATH: "/gemini_pwa_data.json",
    ASSETS_DIR_PATH: "/Gemini_PWA_Assets",
    /**
     * IndexedDBからトークン情報を取得する
     * @returns {Promise<object|null>} 保存されているトークン情報
     */
    async _getTokens() {
      if (!window.dbUtils) return null;
      const tokenData = await window.dbUtils.getSetting("dropboxTokens");
      return tokenData ? tokenData.value : null;
    },
    /**
     * 新しいトークン情報をIndexedDBに保存する
     * @param {object} tokens - 保存するトークン情報
     */
    async _saveTokens(tokens) {
      if (!window.dbUtils) return;
      await window.dbUtils.saveSetting("dropboxTokens", tokens);
    },
    /**
     * リフレッシュトークンを使って新しいアクセストークンを取得する
     * @param {string} refreshToken - リフレッシュトークン
     * @returns {Promise<object>} 新しいトークン情報
     */
    async _refreshAccessToken(refreshToken) {
      console.log("[Dropbox API] Access token expired. Refreshing...");
      const url = "https://api.dropboxapi.com/oauth2/token";
      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("refresh_token", refreshToken);
      params.append("client_id", this.APP_KEY);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error_description || "Failed to refresh token");
      }
      const newAccessTokenData = await response.json();
      const tokens = await this._getTokens() || {};
      const newTokens = {
        ...tokens,
        ...newAccessTokenData,
        expires_at: Date.now() + (newAccessTokenData.expires_in - 300) * 1e3
      };
      await this._saveTokens(newTokens);
      console.log("[Dropbox API] Token refreshed and saved successfully.");
      return newTokens;
    },
    /**
     * APIリクエストを送信する共通関数
     * @param {string} domain - 'api' or 'content'
     * @param {string} endpoint - APIエンドポイント
     * @param {object} options - fetch APIに渡すオプション
     * @param {number} retryCount - リトライ回数
     * @returns {Promise<any>} APIからのレスポンス
     */
    async _request(domain, endpoint, options = {}, retryCount = 0, transientRetries = 0) {
      let tokens = await this._getTokens();
      if (!tokens || !tokens.access_token) {
        throw new Error("Dropbox is not connected.");
      }
      if (Date.now() >= tokens.expires_at) {
        if (!tokens.refresh_token) {
          await this.disconnect();
          throw new Error("Session expired. Please reconnect to Dropbox.");
        }
        tokens = await this._refreshAccessToken(tokens.refresh_token);
      }
      const url = `https://${domain}.dropboxapi.com/2${endpoint}`;
      const headers = {
        "Authorization": `Bearer ${tokens.access_token}`,
        ...options.headers
      };
      const TRANSIENT_STATUS = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
      const MAX_TRANSIENT_RETRIES = 3;
      try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
          if (response.status === 401 && retryCount === 0) {
            console.log("[Dropbox API] Received 401, forcing token refresh and retrying...");
            tokens = await this._refreshAccessToken(tokens.refresh_token);
            return this._request(domain, endpoint, options, 1, transientRetries);
          }
          if (TRANSIENT_STATUS.has(response.status) && transientRetries < MAX_TRANSIENT_RETRIES) {
            const retryAfter = parseInt(response.headers.get("Retry-After"), 10);
            const delay = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1e3, 3e4) : Math.min(1e3 * 2 ** transientRetries, 8e3);
            console.warn(`[Dropbox API] ${response.status} 受信。${delay}ms後に自動リトライします (${transientRetries + 1}/${MAX_TRANSIENT_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this._request(domain, endpoint, options, retryCount, transientRetries + 1);
          }
          let errorText = `Dropbox API Error (${response.status}): ${response.statusText}`;
          try {
            const errorJson = await response.json();
            errorText = errorJson.error_summary || JSON.stringify(errorJson.error) || errorText;
          } catch (e) {
          }
          throw new Error(errorText);
        }
        if (endpoint === "/files/download") {
          return response.blob();
        }
        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        if (error instanceof TypeError && transientRetries < MAX_TRANSIENT_RETRIES) {
          const delay = Math.min(1e3 * 2 ** transientRetries, 8e3);
          console.warn(`[Dropbox API] ネットワークエラー。${delay}ms後に自動リトライします (${transientRetries + 1}/${MAX_TRANSIENT_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this._request(domain, endpoint, options, retryCount, transientRetries + 1);
        }
        if (!error.message.includes("not_found")) {
          console.error(`[Dropbox API] Request error for ${endpoint}:`, error);
        }
        throw error;
      }
    },
    // --- Public API ---
    async testConnection() {
      return this._request("api", "/users/get_current_account", { method: "POST" });
    },
    async uploadMetadata(content) {
      const args = { path: this.METADATA_PATH, mode: "overwrite", mute: true };
      return this._request("content", "/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(args)
        },
        body: content
      });
    },
    async downloadMetadata() {
      const args = { path: this.METADATA_PATH };
      try {
        const blob = await this._request("content", "/files/download", {
          method: "POST",
          headers: { "Dropbox-API-Arg": JSON.stringify(args) }
        });
        return blob.text();
      } catch (error) {
        if (error && error.message && error.message.includes("path/not_found")) {
          return null;
        }
        throw error;
      }
    },
    async uploadAsset(assetBlob, assetId) {
      const path = `${this.ASSETS_DIR_PATH}/${assetId}`;
      const args = { path, mode: "overwrite", mute: true };
      return this._request("content", "/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(args)
        },
        body: assetBlob
      });
    },
    async downloadAsset(assetId) {
      const path = `${this.ASSETS_DIR_PATH}/${assetId}`;
      const args = { path };
      try {
        return await this._request("content", "/files/download", {
          method: "POST",
          headers: { "Dropbox-API-Arg": JSON.stringify(args) }
        });
      } catch (error) {
        if (error.message.includes("path/not_found")) {
          console.warn(`[Dropbox API] Asset not found on cloud: ${assetId}`);
          return null;
        }
        throw error;
      }
    },
    async listAssets() {
      let allEntries = [];
      let hasMore = true;
      let cursor = null;
      const path = this.ASSETS_DIR_PATH;
      try {
        while (hasMore) {
          let response;
          if (cursor) {
            response = await this._request("api", "/files/list_folder/continue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cursor })
            });
          } else {
            response = await this._request("api", "/files/list_folder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path, recursive: false, limit: 2e3 })
            });
          }
          if (response.entries) {
            allEntries = allEntries.concat(response.entries);
          }
          hasMore = response.has_more;
          cursor = response.cursor;
        }
        return allEntries;
      } catch (error) {
        if (error.message.includes("path/not_found")) {
          return [];
        }
        throw error;
      }
    },
    async ensureAssetsFolderExists() {
      try {
        await this._request("api", "/files/get_metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: this.ASSETS_DIR_PATH })
        });
      } catch (error) {
        if (error.message.includes("path/not_found")) {
          console.log(`[Dropbox API] Assets folder not found. Creating folder: ${this.ASSETS_DIR_PATH}`);
          await this._request("api", "/files/create_folder_v2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: this.ASSETS_DIR_PATH, autorename: false })
          });
        } else {
          throw error;
        }
      }
    },
    async deleteAssets(assetIds) {
      if (!assetIds || assetIds.length === 0) return;
      const entries = assetIds.map((id) => ({ path: `${this.ASSETS_DIR_PATH}/${id}` }));
      const initialResponse = await this._request("api", "/files/delete_batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
      if (initialResponse[".tag"] !== "async_job_id") {
        console.log("[Dropbox API] Delete job completed synchronously or no job ID returned.", initialResponse);
        return;
      }
      const jobId = initialResponse.async_job_id;
      console.log(`[Dropbox API] Started async delete job: ${jobId}. Polling for completion...`);
      const maxAttempts = 60;
      let attempts = 0;
      let jobStatus;
      const sleep2 = /* @__PURE__ */ __name((ms) => new Promise((resolve) => setTimeout(resolve, ms)), "sleep");
      do {
        await sleep2(2e3);
        attempts++;
        try {
          jobStatus = await this._request("api", "/files/delete_batch/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ async_job_id: jobId })
          });
          console.log(`[Dropbox API] Polling delete job #${attempts}: Status is '${jobStatus[".tag"]}'`);
        } catch (pollError) {
          console.error(`[Dropbox API] Polling for delete job failed.`, pollError);
          throw new Error(`Polling for delete job ${jobId} failed: ${pollError.message}`);
        }
      } while (jobStatus[".tag"] === "in_progress" && attempts < maxAttempts);
      if (jobStatus[".tag"] === "complete") {
        console.log("[Dropbox API] Async delete job completed successfully.");
        return;
      } else {
        const errorMessage = `Async delete job did not complete successfully. Final status: ${jobStatus[".tag"]}. Details: ${JSON.stringify(jobStatus)}`;
        console.error(`[Dropbox API] ${errorMessage}`);
        throw new Error(errorMessage);
      }
    },
    async getAccessToken(code, redirectUri, codeVerifier) {
      console.log("[Dropbox API] Requesting access token...");
      const url = "https://api.dropboxapi.com/oauth2/token";
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", redirectUri);
      params.append("client_id", this.APP_KEY);
      params.append("code_verifier", codeVerifier);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error_description || `Token API Error (${response.status})`);
      }
      const tokenData = await response.json();
      tokenData.expires_at = Date.now() + (tokenData.expires_in - 300) * 1e3;
      await this._saveTokens(tokenData);
      return tokenData;
    },
    async disconnect() {
      const tokens = await this._getTokens();
      if (tokens && tokens.access_token) {
        try {
          await this._request("api", "/auth/token/revoke", { method: "POST" });
        } catch (error) {
          console.warn("Failed to revoke token on Dropbox side, but clearing local tokens anyway.", error);
        }
      }
      await window.dbUtils.saveSetting("dropboxTokens", null);
      console.log("[Dropbox API] Disconnected and local tokens cleared.");
    },
    async uploadAssetsInBatches(assetsToUpload, progressCallback) {
      if (!assetsToUpload || assetsToUpload.length === 0) {
        console.log("[Dropbox API] No assets to upload in batch.");
        return;
      }
      const total = assetsToUpload.length;
      console.log(`[Dropbox API] Starting batch upload for ${total} assets.`);
      const BATCH_SIZE = 5;
      const DELAY_MS = 1e3;
      const sleep2 = /* @__PURE__ */ __name((ms) => new Promise((resolve) => setTimeout(resolve, ms)), "sleep");
      for (let i = 0; i < total; i++) {
        const { assetId, asset } = assetsToUpload[i];
        if (progressCallback) {
          progressCallback(i + 1, total);
        }
        try {
          await this.uploadAsset(asset.blob, assetId);
          console.log(`[Dropbox API] Batch upload: Successfully uploaded ${assetId} (${i + 1}/${total})`);
        } catch (error) {
          console.error(`[Dropbox API] Batch upload: Failed to upload ${assetId}.`, error);
          throw new Error(`Failed to upload asset ${assetId} during batch operation. Aborting. Original error: ${error.message}`);
        }
        if ((i + 1) % BATCH_SIZE === 0 && i < total - 1) {
          console.log(`[Dropbox API] Batch limit reached. Waiting for ${DELAY_MS}ms...`);
          await sleep2(DELAY_MS);
        }
      }
      console.log(`[Dropbox API] Batch upload completed for ${total} assets.`);
    },
    // --- Lock File Operations ---
    async uploadLockFile(operationType) {
      if (!operationType || !["push", "pull"].includes(operationType)) {
        throw new Error('Lock file operation type must be "push" or "pull".');
      }
      console.log(`[Dropbox API] Uploading lock file for operation: ${operationType}`);
      const lockData = JSON.stringify({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        operation: operationType
      });
      const path = "/.sync_lock";
      try {
        await this._request("content", "/files/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": JSON.stringify({
              path,
              mode: "overwrite",
              autorename: false,
              mute: true
            })
          },
          body: lockData
        });
      } catch (error) {
        console.error("Lock file upload failed:", error);
        throw new Error("ロックファイルのアップロードに失敗しました。");
      }
    },
    async deleteLockFile() {
      const path = "/.sync_lock";
      console.log("[Dropbox API] Deleting lock file...");
      try {
        return await this._request("api", "/files/delete_v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path })
        });
      } catch (error) {
        if (error.message.includes("not_found")) {
          console.warn("[Dropbox API] Lock file not found during deletion, which is okay.");
          return null;
        }
        throw error;
      }
    },
    async checkLockFile() {
      const path = "/.sync_lock";
      try {
        const blob = await this._request("content", "/files/download", {
          method: "POST",
          headers: { "Dropbox-API-Arg": JSON.stringify({ path }) }
        });
        const content = await blob.text();
        const data = JSON.parse(content);
        console.log("[Dropbox API] Lock file found.", data);
        return data;
      } catch (error) {
        if (error.message.includes("path/not_found")) {
          console.log("[Dropbox API] Lock file not found.");
          return null;
        }
        throw error;
      }
    }
  };

  // src/dom-elements.js
  var elements;
  try {
    elements = {
      appContainer: document.querySelector(".app-container"),
      appHeader: document.querySelector(".app-header"),
      chatScreen: document.getElementById("chat-screen"),
      historyScreen: document.getElementById("history-screen"),
      settingsScreen: document.getElementById("settings-screen"),
      chatTitle: document.getElementById("chat-title"),
      messageContainer: document.getElementById("message-container"),
      userInput: document.getElementById("user-input"),
      sendButton: document.getElementById("send-button"),
      loadingIndicator: document.getElementById("loading-indicator"),
      historyList: document.getElementById("history-list"),
      historyTitle: document.getElementById("history-title"),
      noHistoryMessage: document.getElementById("no-history-message"),
      historyItemTemplate: document.querySelector(".js-history-item-template"),
      themeColorMeta: document.getElementById("theme-color-meta"),
      systemPromptArea: document.getElementById("system-prompt-area"),
      systemPromptDetails: document.getElementById("system-prompt-details"),
      systemPromptEditor: document.getElementById("system-prompt-editor"),
      saveSystemPromptBtn: document.getElementById("save-system-prompt-btn"),
      cancelSystemPromptBtn: document.getElementById("cancel-system-prompt-btn"),
      apiProviderSelect: document.getElementById("api-provider"),
      apiProviderRow: document.getElementById("api-provider-row"),
      apiKeyInput: document.getElementById("api-key"),
      zaiApiKeyInput: document.getElementById("zai-api-key"),
      geminiApiKeyContainer: document.getElementById("gemini-api-key-container"),
      zaiApiKeyContainer: document.getElementById("zai-api-key-container"),
      openrouterApiKeyInput: document.getElementById("openrouter-api-key"),
      openrouterApiKeyContainer: document.getElementById("openrouter-api-key-container"),
      openrouterModelInput: document.getElementById("openrouter-model-input"),
      openrouterModelInputContainer: document.getElementById("openrouter-model-input-container"),
      bedrockAccessKeyInput: document.getElementById("bedrock-access-key"),
      bedrockSecretKeyInput: document.getElementById("bedrock-secret-key"),
      bedrockRegionSelect: document.getElementById("bedrock-region"),
      bedrockApiKeyContainer: document.getElementById("bedrock-api-key-container"),
      openaiApiKeyInput: document.getElementById("openai-api-key"),
      openaiApiKeyContainer: document.getElementById("openai-api-key-container"),
      anthropicApiKeyInput: document.getElementById("anthropic-api-key"),
      anthropicApiKeyContainer: document.getElementById("anthropic-api-key-container"),
      anthropicCacheTTLSelect: document.getElementById("anthropic-cache-ttl"),
      anthropicEffortSelect: document.getElementById("anthropic-effort"),
      novelaiApiKeyInput: document.getElementById("novelai-api-key"),
      novelaiModelSelect: document.getElementById("novelai-model"),
      groqApiKeyInput: document.getElementById("groq-api-key"),
      groqApiKeyContainer: document.getElementById("groq-api-key-container"),
      deepseekApiKeyInput: document.getElementById("deepseek-api-key"),
      deepseekApiKeyContainer: document.getElementById("deepseek-api-key-container"),
      sakanaApiKeyInput: document.getElementById("sakana-api-key"),
      sakanaApiKeyContainer: document.getElementById("sakana-api-key-container"),
      xaiApiKeyInput: document.getElementById("xai-api-key"),
      xaiApiKeyContainer: document.getElementById("xai-api-key-container"),
      mistralApiKeyInput: document.getElementById("mistral-api-key"),
      mistralApiKeyContainer: document.getElementById("mistral-api-key-container"),
      modelNameSelect: document.getElementById("model-name"),
      modelNameLabel: document.getElementById("model-name-label"),
      userDefinedModelsGroup: document.getElementById("user-defined-models-group"),
      systemPromptDefaultTextarea: document.getElementById("system-prompt-default"),
      temperatureInput: document.getElementById("temperature"),
      maxTokensInput: document.getElementById("max-tokens"),
      topKInput: document.getElementById("top-k"),
      topPInput: document.getElementById("top-p"),
      thinkingBudgetInput: document.getElementById("thinking-budget"),
      includeThoughtsToggle: document.getElementById("include-thoughts-toggle"),
      thoughtTranslationOptionsDiv: document.getElementById("thought-translation-options"),
      enableThoughtTranslationCheckbox: document.getElementById("enable-thought-translation"),
      thoughtTranslationModelSelect: document.getElementById("thought-translation-model"),
      dummyUserInput: document.getElementById("dummy-user"),
      dummyEnabledToggle: document.getElementById("dummy-enabled-toggle"),
      applyDummyToProofreadCheckbox: document.getElementById("apply-dummy-to-proofread"),
      applyDummyToTranslateCheckbox: document.getElementById("apply-dummy-to-translate"),
      dummyModelInput: document.getElementById("dummy-model"),
      reverseDummyOrderCheckbox: document.getElementById("reverse-dummy-order"),
      concatDummyModelCheckbox: document.getElementById("concat-dummy-model"),
      additionalModelsTextarea: document.getElementById("additional-models"),
      enterToSendCheckbox: document.getElementById("enter-to-send"),
      historySortOrderSelect: document.getElementById("history-sort-order"),
      darkModeToggle: document.getElementById("dark-mode-toggle"),
      debugModeToggle: document.getElementById("debug-mode-toggle"),
      fontFamilyInput: document.getElementById("font-family-input"),
      hideSystemPromptToggle: document.getElementById("hide-system-prompt-toggle"),
      geminiEnableGroundingToggle: document.getElementById("gemini-enable-grounding-toggle"),
      geminiEnableFunctionCallingToggle: document.getElementById("gemini-enable-function-calling-toggle"),
      forceFunctionCallingToggle: document.getElementById("force-function-calling-toggle"),
      appVersionSpan: document.getElementById("app-version"),
      backgroundImageInput: document.getElementById("background-image-input"),
      uploadBackgroundBtn: document.getElementById("upload-background-btn"),
      backgroundThumbnail: document.getElementById("background-thumbnail"),
      deleteBackgroundBtn: document.getElementById("delete-background-btn"),
      gotoHistoryBtn: document.getElementById("goto-history-btn"),
      gotoSettingsBtn: document.getElementById("goto-settings-btn"),
      backToChatFromHistoryBtn: document.getElementById("back-to-chat-from-history"),
      backToChatFromSettingsBtn: document.getElementById("back-to-chat-from-settings"),
      newChatBtn: document.getElementById("new-chat-btn"),
      updateAppBtn: document.getElementById("update-app-btn"),
      clearDataBtn: document.getElementById("clear-data-btn"),
      importHistoryBtn: document.getElementById("import-history-btn"),
      importHistoryInput: document.getElementById("import-history-input"),
      alertDialog: document.getElementById("alertDialog"),
      alertMessage: document.getElementById("alertDialog")?.querySelector(".dialog-message"),
      alertOkBtn: document.getElementById("alertDialog")?.querySelector(".dialog-ok-btn"),
      confirmDialog: document.getElementById("confirmDialog"),
      confirmMessage: document.getElementById("confirmDialog")?.querySelector(".dialog-message"),
      confirmOkBtn: document.getElementById("confirmDialog")?.querySelector(".dialog-ok-btn"),
      confirmCancelBtn: document.getElementById("confirmDialog")?.querySelector(".dialog-cancel-btn"),
      promptDialog: document.getElementById("promptDialog"),
      promptMessage: document.getElementById("promptDialog")?.querySelector(".dialog-message"),
      promptInput: document.getElementById("promptDialog")?.querySelector(".dialog-input"),
      promptOkBtn: document.getElementById("promptDialog")?.querySelector(".dialog-ok-btn"),
      promptCancelBtn: document.getElementById("promptDialog")?.querySelector(".dialog-cancel-btn"),
      swipeNavigationToggle: document.getElementById("swipe-navigation-toggle"),
      enableProofreadingCheckbox: document.getElementById("enable-proofreading"),
      proofreadingOptionsDiv: document.getElementById("proofreading-options"),
      proofreadingModelNameSelect: document.getElementById("proofreading-model-name"),
      proofreadingSystemInstructionTextarea: document.getElementById("proofreading-system-instruction"),
      attachFileBtn: document.getElementById("attach-file-btn"),
      fileUploadDialog: document.getElementById("fileUploadDialog"),
      fileInput: document.getElementById("file-input"),
      selectFilesBtn: document.getElementById("select-files-btn"),
      selectedFilesList: document.getElementById("selected-files-list"),
      confirmAttachBtn: document.getElementById("confirm-attach-btn"),
      cancelAttachBtn: document.getElementById("cancel-attach-btn"),
      enableAutoRetryCheckbox: document.getElementById("enable-auto-retry"),
      maxRetriesInput: document.getElementById("max-retries"),
      autoRetryOptionsDiv: document.getElementById("auto-retry-options"),
      useFixedRetryDelayCheckbox: document.getElementById("use-fixed-retry-delay"),
      fixedRetryDelayContainer: document.getElementById("fixed-retry-delay-container"),
      fixedRetryDelayInput: document.getElementById("fixed-retry-delay-seconds"),
      maxBackoffDelayContainer: document.getElementById("max-backoff-delay-container"),
      maxBackoffDelayInput: document.getElementById("max-backoff-delay-seconds"),
      enableApiTimeoutCheckbox: document.getElementById("enable-api-timeout"),
      apiTimeoutSecondsInput: document.getElementById("api-timeout-seconds"),
      apiTimeoutOptions: document.getElementById("api-timeout-options"),
      googleSearchApiKeyInput: document.getElementById("google-search-api-key"),
      googleSearchEngineIdInput: document.getElementById("google-search-engine-id"),
      overlayOpacitySlider: document.getElementById("overlay-opacity-slider"),
      overlayOpacityValue: document.getElementById("overlay-opacity-value"),
      headerColorInput: document.getElementById("header-color-input"),
      resetHeaderColorBtn: document.getElementById("reset-header-color-btn"),
      messageOpacitySlider: document.getElementById("message-opacity-slider"),
      messageOpacityValue: document.getElementById("message-opacity-value"),
      modelWarningMessage: document.getElementById("model-warning-message"),
      profileCardHeaderWrapper: document.getElementById("profile-card-header-wrapper"),
      profileCardHeader: document.getElementById("profile-card-header"),
      profileCardIconContainer: document.getElementById("profile-card-icon-container"),
      profileCardName: document.getElementById("profile-card-name"),
      headerProfileMenu: document.getElementById("header-profile-menu"),
      profileCardHeaderWrapperSettings: document.getElementById("profile-card-header-wrapper-settings"),
      profileCardHeaderSettings: document.getElementById("profile-card-header-settings"),
      profileCardIconContainerSettings: document.getElementById("profile-card-icon-container-settings"),
      profileCardNameSettings: document.getElementById("profile-card-name-settings"),
      headerProfileMenuSettings: document.getElementById("header-profile-menu-settings"),
      profileManagementGroup: document.getElementById("profile-management-group"),
      profileDisplayCard: document.getElementById("profile-display-card"),
      profileDisplayIcon: document.getElementById("profile-display-icon"),
      profileDisplayNameMain: document.getElementById("profile-display-name-main"),
      profileDisplayNameSub: document.getElementById("profile-display-name-sub"),
      profileDisplayStatus: document.getElementById("profile-display-status"),
      profileEditNameBtn: document.getElementById("profile-edit-name-btn"),
      profileIconInput: document.getElementById("profile-icon-input"),
      profileResetIconBtn: document.getElementById("profile-reset-icon-btn"),
      profileSaveNewBtn: document.getElementById("profile-save-new-btn"),
      profileUpdateBtn: document.getElementById("profile-update-btn"),
      profileDeleteBtn: document.getElementById("profile-delete-btn"),
      profileExportBtn: document.getElementById("profile-export-btn"),
      profileImportBtn: document.getElementById("profile-import-btn"),
      profileImportInput: document.getElementById("profile-import-input"),
      autoScrollToggle: document.getElementById("auto-scroll-toggle"),
      enableWideModeToggle: document.getElementById("enable-wide-mode-toggle"),
      assetCountDisplay: document.getElementById("asset-count-display"),
      assetExportBtn: document.getElementById("asset-export-btn"),
      assetImportBtn: document.getElementById("asset-import-btn"),
      assetImportInput: document.getElementById("asset-import-input"),
      assetConflictDialog: document.getElementById("assetConflictDialog"),
      assetConflictMessage: document.getElementById("assetConflictDialog")?.querySelector(".dialog-message"),
      assetConflictApplyAll: document.getElementById("apply-to-all-checkbox"),
      manageAssetsBtn: document.getElementById("manage-assets-btn"),
      assetManagementDialog: document.getElementById("assetManagementDialog"),
      assetListContainer: document.getElementById("asset-list-container"),
      closeAssetDialogBtn: document.getElementById("close-asset-dialog-btn"),
      deleteAllAssetsBtn: document.getElementById("delete-all-assets-btn"),
      memoryToggleBtn: document.getElementById("memory-toggle-btn"),
      enableMemoryToggle: document.getElementById("enable-memory-toggle"),
      memoryOptionsContainer: document.getElementById("memory-options-container"),
      memoryAutoSaveIntervalSelect: document.getElementById("memory-auto-save-interval"),
      manageMemoryBtn: document.getElementById("manage-memory-btn"),
      memoryManagementDialog: document.getElementById("memoryManagementDialog"),
      memoryListContainer: document.getElementById("memory-list-container"),
      newMemoryInput: document.getElementById("new-memory-input"),
      addMemoryBtn: document.getElementById("add-memory-btn"),
      closeMemoryDialogBtn: document.getElementById("close-memory-dialog-btn"),
      deleteAllMemoryBtn: document.getElementById("delete-all-memory-btn"),
      headerAutoHideToggle: document.getElementById("header-auto-hide-toggle"),
      headerTriggerArea: document.getElementById("header-trigger-area"),
      chatStatsBtn: document.getElementById("chat-stats-btn"),
      chatStatsDialog: document.getElementById("chatStatsDialog"),
      chatStatsContent: document.getElementById("chat-stats-content"),
      chatStatsCloseBtn: document.getElementById("chat-stats-close-btn"),
      summarizeHistoryBtn: document.getElementById("summarize-history-btn"),
      summaryModelNameSelect: document.getElementById("summary-model-name"),
      summarySystemPromptTextarea: document.getElementById("summary-system-prompt"),
      summaryDialog: document.getElementById("summaryDialog"),
      summaryStats: document.getElementById("summary-stats"),
      summaryEditor: document.getElementById("summary-editor"),
      summaryCancelBtn: document.getElementById("summary-cancel-btn"),
      summaryRegenerateBtn: document.getElementById("summary-regenerate-btn"),
      summaryConfirmBtn: document.getElementById("summary-confirm-btn"),
      enableSummaryButtonToggle: document.getElementById("enable-summary-button-toggle"),
      progressDialog: document.getElementById("progressDialog"),
      progressMessage: document.getElementById("progress-message"),
      floatingActionPanel: document.getElementById("floating-action-panel"),
      scrollToTopBtn: document.getElementById("scroll-to-top-btn"),
      scrollToBottomBtn: document.getElementById("scroll-to-bottom-btn"),
      scrollBottomFab: document.getElementById("scroll-bottom-fab"),
      rangeImageSaveBtn: document.getElementById("range-image-save-btn"),
      rangeImageBar: document.getElementById("range-image-bar"),
      rangeImageInfo: document.getElementById("range-image-info"),
      rangeImageSaveConfirmBtn: document.getElementById("range-image-save-confirm-btn"),
      rangeImageCancelBtn: document.getElementById("range-image-cancel-btn"),
      floatingPanelBehaviorSelect: document.getElementById("floating-panel-behavior"),
      characterProfileBtn: document.getElementById("character-profile-btn"),
      characterProfileDialog: document.getElementById("characterProfileDialog"),
      profileBackBtn: document.getElementById("profile-back-btn"),
      characterListPane: document.getElementById("character-list-pane"),
      characterDetailPane: document.getElementById("character-detail-pane"),
      closeProfileDialogBtn: document.getElementById("close-profile-dialog-btn"),
      dropboxAuthBtn: document.getElementById("dropbox-auth-btn"),
      dropboxAuthState: document.getElementById("dropbox-auth-state"),
      dropboxConnectedState: document.getElementById("dropbox-connected-state"),
      dropboxUserName: document.getElementById("dropbox-user-name"),
      dropboxSyncBtn: document.getElementById("dropbox-sync-btn"),
      dropboxRestoreBtn: document.getElementById("dropbox-restore-btn"),
      dropboxDisconnectBtn: document.getElementById("dropbox-disconnect-btn"),
      syncStatusHeaderIcon: document.getElementById("sync-status-header-icon"),
      syncStatusSettingsIcon: document.getElementById("sync-status-settings-icon"),
      dropboxSyncFrequencySelect: document.getElementById("dropbox-sync-frequency"),
      syncProgressText: document.getElementById("sync-progress-text"),
      lastSyncTimeDisplay: document.getElementById("last-sync-time-display"),
      sdApiUrlInput: document.getElementById("sd-api-url"),
      sdApiUserInput: document.getElementById("sd-api-user"),
      sdApiPasswordInput: document.getElementById("sd-api-password"),
      sdTestConnectionBtn: document.getElementById("sd-test-connection-btn"),
      sdEnableQualityCheckerCheckbox: document.getElementById("sd-enable-quality-checker"),
      sdQualityCheckerOptionsDiv: document.getElementById("sd-quality-checker-options"),
      sdQcModelSelect: document.getElementById("sd-qc-model"),
      sdQcPromptTextarea: document.getElementById("sd-qc-prompt"),
      sdQcRetriesInput: document.getElementById("sd-qc-retries"),
      sdPromptImproveModelSelect: document.getElementById("sd-prompt-improve-model"),
      sdPromptImproveSystemPromptTextarea: document.getElementById("sd-prompt-improve-system-prompt"),
      debugLogBtn: document.getElementById("debug-log-btn"),
      debugLogDialog: document.getElementById("debugLogDialog"),
      logContainer: document.getElementById("log-container"),
      copyLogsBtn: document.getElementById("copy-logs-btn"),
      clearLogsBtn: document.getElementById("clear-logs-btn"),
      closeLogDialogBtn: document.getElementById("close-log-dialog-btn")
    };
    document.body.classList.toggle("dropbox-connected", false);
    for (const key in elements) {
      if (elements[key] === null) {
        elements[key] = document.createElement("div");
      }
    }
  } catch (error) {
    console.error("起動時エラー:", error);
    if (sessionStorage.getItem("reloadAttempted") !== "true") {
      console.log("初回エラーのため、強制リロードを試みます...");
      sessionStorage.setItem("reloadAttempted", "true");
      location.reload(true);
    } else {
      console.error("リロード後もエラーが解決しなかったため、処理を停止します。");
      sessionStorage.removeItem("reloadAttempted");
      document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
            <h1>アプリケーションの起動に失敗しました</h1>
            <p>エラー: ${error.message}</p>
            <p>自動リロードを試みましたが、問題が解決しませんでした。ブラウザのキャッシュを手動でクリアする必要があるかもしれません。</p>
        </div>`;
    }
  }

  // src/constants.js
  var DB_NAME = "GeminiPWA_DB";
  var DB_VERSION = 15;
  var PROJECTS_STORE = "projects";
  var SETTINGS_STORE = "settings";
  var PROFILES_STORE = "profiles";
  var CHATS_STORE = "chats";
  var IMAGE_STORE = "image_store";
  var CHAT_UPDATEDAT_INDEX = "updatedAtIndex";
  var CHAT_CREATEDAT_INDEX = "createdAtIndex";
  var DEFAULT_MODEL = "gemini-2.5-pro";
  var DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var CHAT_TITLE_LENGTH = 15;
  var TEXTAREA_MAX_HEIGHT = 120;
  var GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
  var ZAI_API_BASE_URL = "https://api.z.ai/api/paas/v4/chat/completions";
  var OPENROUTER_API_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
  var GROQ_API_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
  var DEEPSEEK_API_BASE_URL = "https://api.deepseek.com/chat/completions";
  var XAI_API_BASE_URL = "https://api.x.ai/v1/chat/completions";
  var MISTRAL_API_BASE_URL = "https://api.mistral.ai/v1/chat/completions";
  var SAKANA_API_BASE_URL = "https://api.sakana.ai/v1/chat/completions";
  var DUPLICATE_SUFFIX = " (コピー)";
  var IMPORT_PREFIX = "(取込) ";
  var LIGHT_THEME_COLOR = "#908675";
  var DARK_THEME_COLOR = "#908675";
  var APP_VERSION = "1.25";
  var DEFAULT_ZAI_MODEL = "glm-4.6";
  var DEFAULT_OPENROUTER_MODEL = "x-ai/grok-4.1-fast";
  var VERSION_NOTICE_SESSION_KEY = "pendingVersionNotice";
  var VERSION_ACK_STORAGE_KEY = "appVersionAcknowledged";
  var VERSION_LEGACY_STORAGE_KEY = "appVersion";
  var GEMINI_MODELS = [
    { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
    { value: "gemini-2.5-flash", label: "gemini-2.5-flash" },
    { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite" },
    { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    { value: "gemini-2.0-flash-lite", label: "gemini-2.0-flash-lite" },
    {
      value: "gemini-2.5-flash-preview-09-2025",
      label: "gemini-2.5-flash-preview-09-2025",
      group: "プレビュー版"
    },
    {
      value: "gemini-2.5-flash-lite-preview-09-2025",
      label: "gemini-2.5-flash-lite-preview-09-2025",
      group: "プレビュー版"
    },
    {
      value: "gemini-2.5-flash-image-preview",
      label: "gemini-2.5-flash-image-preview (Nano Banana)",
      group: "プレビュー版"
    },
    { value: "gemini-3-pro-preview", label: "gemini-3-pro-preview", group: "プレビュー版" },
    { value: "gemini-3.1-pro-preview", label: "gemini-3.1-pro-preview", group: "プレビュー版" }
  ];
  var ZAI_MODELS = [
    { value: "glm-4.6", label: "GLM-4.6" },
    { value: "glm-4.5-Air", label: "GLM-4.5 Air" },
    { value: "glm-4.5-flash", label: "GLM-4.5 Flash" }
  ];
  var BEDROCK_MODELS = [
    {
      value: "jp.anthropic.claude-sonnet-4-5-20250929-v1:0",
      label: "Claude Sonnet 4.5 (推奨・東京リージョン用)"
    },
    {
      value: "anthropic.claude-sonnet-4-5-20250929-v1:0",
      label: "Claude Sonnet 4.5 (標準リージョン用)"
    },
    { value: "anthropic.claude-3-5-sonnet-20241022-v2:0", label: "Claude 3.5 Sonnet v2" },
    { value: "anthropic.claude-3-5-sonnet-20240620-v1:0", label: "Claude 3.5 Sonnet v1" },
    { value: "anthropic.claude-3-opus-20240229-v1:0", label: "Claude 3 Opus" },
    { value: "anthropic.claude-3-sonnet-20240229-v1:0", label: "Claude 3 Sonnet" },
    { value: "anthropic.claude-3-haiku-20240307-v1:0", label: "Claude 3 Haiku" }
  ];
  var DEFAULT_BEDROCK_MODEL = "jp.anthropic.claude-sonnet-4-5-20250929-v1:0";
  var DEFAULT_BEDROCK_REGION = "us-east-1";
  var OPENAI_MODELS = [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { value: "o3", label: "o3", group: "推論モデル" },
    { value: "o4-mini", label: "o4-mini", group: "推論モデル" }
  ];
  var DEFAULT_OPENAI_MODEL = "gpt-4o";
  var ANTHROPIC_MODELS = [
    { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" }
  ];
  var DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
  var GROQ_MODELS = [
    { value: "moonshotai/kimi-k2-instruct", label: "Kimi K2 Instruct" },
    { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B" },
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "qwen/qwen3-32b", label: "Qwen3 32B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" }
  ];
  var DEFAULT_GROQ_MODEL = "moonshotai/kimi-k2-instruct";
  var DEEPSEEK_MODELS = [
    { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
    { value: "deepseek-chat", label: "DeepSeek Chat (V3)" },
    { value: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" }
  ];
  var DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
  var XAI_MODELS = [
    { value: "grok-4", label: "Grok 4" },
    { value: "grok-3", label: "Grok 3" },
    { value: "grok-3-mini", label: "Grok 3 Mini" },
    { value: "grok-2-1212", label: "Grok 2" }
  ];
  var DEFAULT_XAI_MODEL = "grok-4";
  var MISTRAL_MODELS = [
    { value: "mistral-large-latest", label: "Mistral Large (latest)" },
    { value: "mistral-medium-latest", label: "Mistral Medium (latest)" },
    { value: "mistral-small-latest", label: "Mistral Small (latest)" },
    { value: "codestral-latest", label: "Codestral (latest)" },
    { value: "open-mistral-nemo", label: "Mistral Nemo" }
  ];
  var DEFAULT_MISTRAL_MODEL = "mistral-large-latest";
  var SAKANA_MODELS = [
    { value: "fugu", label: "Fugu" },
    { value: "fugu-ultra", label: "Fugu Ultra" }
  ];
  var DEFAULT_SAKANA_MODEL = "fugu";
  var VERSION_HISTORY = {
    1.25: [
      "テキストアーティファクト機能：AIの応答内のコードブロック（```で囲まれた部分）を、コピーボタン付きのカードとして表示。プロンプトや長文をワンタップでコピーできます。"
    ],
    1.24: [
      "【セキュリティ修正】AI応答・インポートしたログ内の生HTMLが実行され得るXSS脆弱性を修正。生HTMLはエスケープ表示、javascript:等の危険なリンクは無効化されます（APIキー・Dropboxトークン保護のため必ず更新してください）。",
      "Anthropic会話履歴キャッシュを改善：トップレベル自動キャッシュ方式（cache_control）に変更し、キャッシュポイントが会話の伸びに合わせて自動前進。TTLは設定値（5分/1時間）に従います。",
      "コスト計算を改善：5分/1時間キャッシュ書き込みを区別して計算。料金テーブルを現行価格に更新（Opus 4.5〜4.8: $5/$25、Haiku 4.5: $1/$5 等）。",
      "モデル名が記録されていないメッセージを現在のモデル価格で計算してしまい推定コストがずれる問題を修正。",
      "長期記憶の自動学習間隔に「75」「100メッセージごと」を追加。"
    ],
    1.22: [
      "Dropbox自動同期でデータが一時的に消えて見える不具合を修正。競合マージ後にページ全体を再読み込みしていた処理を、チャット履歴のみ静かに再読み込みするソフトリロードに変更しました。"
    ],
    "1.20": [
      "初回の会話往復後にチャットタイトルが自動生成されない不具合を修正。プロバイダー別（Gemini / Anthropic / OpenAI互換）のタイトル生成ロジックが正しく動作するよう改善しました。",
      "重複定義されていた `autoGenerateTitle` を整理し、意図しない上書きによる挙動不一致を解消しました。",
      "重複定義されていた `exportProfile` / `importProfile` を統合し、プロファイルのインポート後にアクティブプロファイル反映・UI更新・同期フラグ更新が確実に行われるよう修正しました。",
      "内部コードの重複を削減し、将来の保守時に不具合を生みにくい構成へ整理しました。",
      "履歴一覧のトークン表示を改善し、合計トークンに加えて入力（prompt）/出力（completion）の内訳を表示するようにしました。"
    ],
    1.14: [
      "Claude APIの適応的思考（adaptive thinking）に対応。思考の深さ（effort: low/medium/high/max）を設定画面から選択可能に。",
      "Claude Opus 4.7モデルを追加。",
      "モデルの応答にターン番号とモデル名を小さく表示するようにしました（例: #1 claude-opus-4-6）。",
      "モデル側の吹き出し幅を拡大し、スマホでも読みやすくしました。",
      "Anthropicプロンプトキャッシュ設定に「なし（キャッシュ未使用）」オプションを追加。"
    ],
    1.13: [
      "Claude API使用時にトークン数（候補トークン/合計トークン）が表示されない不具合を修正。",
      "Function Calling使用後にツールをOFFにしてチャットすると発生していた`tool_use without tool_result`エラーを修正。",
      "Claude APIのプロンプトキャッシングを大幅改善。ツール定義と会話履歴にキャッシュブレークポイントを追加し、長い会話でのAPI費用を削減。"
    ],
    1.12: [
      "ユーザー追加モデル対応を全面強化。思考プロセス翻訳、校正、要約、画像品質チェック、プロンプト改善の各機能で、ユーザーが追加したモデルを選択可能に。",
      "「追加モデル (カンマ区切り):」入力後、ページリロード不要で全モデル選択セレクターに即座に反映されるよう改善。",
      "`edit_image`関数にユーザー指定モデル機能を追加。`gemini-3-pro-image-preview`を含む任意のモデルで画像編集が可能に。",
      "開発者が更新を停止しても、ユーザーが新規モデルを追加すれば各種機能で使用できる拡張性の高い設計を実現。"
    ],
    1.11: [
      "デバッグモード有効時のみ、`OpenRouter`、`Z.ai`、`AmazonBedrock`のプロバイダーを追加。開発者向け機能のため既存機能との連携は保証されていません。",
      "設定画面に「ダミーUserプロンプトとダミーModelプロンプトの順序を入れ替える」を追加。",
      "metadata内のキャラクター名や関係性名に特殊文字が使用されているとquerySelectorが正常に動作しない問題を修正"
    ],
    1.1: [
      "gemini-3-pro-previewモデルを追加しました。",
      "gemini-3-pro-previewでのFunction Calling使用時に発生していた「thought_signature」エラーを修正しました。"
    ],
    "1.0": [
      "Dropbox連携機能とStable Diffusion WebUI/Forge/Reforge連携を追加し、PWA内のデータと画像生成ワークフローをクラウドやローカル環境とシームレスに同期できるようにしました。",
      "添付ファイルのサムネイル表示やアップデート内容を告知するダイアログ、URLコンテンツを取り込むfetch_url_content関数、プロファイルへのgemini-2.5-pro使用回数表示、デバッグモード切替などのUI/機能改善を実装しました。",
      "gemini-2.5-flash-imageやveo-3.1シリーズなど最新モデルの追加、画像/動画関連関数のモデル選択改善、URL要約や要約機能まわりのエラーハンドリング強化を行いました。",
      "Firefoxでのパフォーマンス劣化や再生成時の履歴破損、記憶管理画面の不具合など多数のバグを修正し、DB関連関数の保存ロジックも刷新しました。"
    ]
  };
  var SWIPE_THRESHOLD = 50;
  var ZOOM_THRESHOLD = 1.01;
  var MAX_FILE_SIZE = 10 * 1024 * 1024;
  var MAX_TOTAL_ATTACHMENT_SIZE = 50 * 1024 * 1024;
  var INITIAL_RETRY_DELAY = 100;
  var MAX_PROFILES = 5;

  // src/state.js
  var state = {
    tabId: `tab_${Date.now()}_${Math.random()}`,
    // このタブを識別するユニークID
    db: null,
    currentChatId: null,
    currentMessages: [],
    currentSystemPrompt: "",
    currentPersistentMemory: {},
    // 現在のチャットの永続メモリ
    currentSummarizedContext: null,
    profiles: [],
    // 全プロファイルのリスト
    activeProfileId: null,
    // 現在アクティブなプロファイルのID
    activeProfile: null,
    // 現在アクティブなプロファイルの完全なデータ
    profileIconUrls: /* @__PURE__ */ new Map(),
    videoUrlCache: /* @__PURE__ */ new Map(),
    imageUrlCache: /* @__PURE__ */ new Map(),
    settings: {
      apiProvider: "gemini",
      apiKey: "",
      zaiApiKey: "",
      openrouterApiKey: "",
      bedrockAccessKey: "",
      bedrockSecretKey: "",
      bedrockRegion: DEFAULT_BEDROCK_REGION,
      openaiApiKey: "",
      anthropicApiKey: "",
      anthropicCacheTTL: "5m",
      anthropicEffort: "high",
      novelaiApiKey: "",
      novelaiModel: "nai-diffusion-4-5-curated",
      groqApiKey: "",
      deepseekApiKey: "",
      xaiApiKey: "",
      mistralApiKey: "",
      sakanaApiKey: "",
      modelName: DEFAULT_MODEL,
      systemPrompt: "",
      temperature: null,
      maxTokens: null,
      topK: null,
      topP: null,
      thinkingBudget: null,
      includeThoughts: false,
      enableThoughtTranslation: true,
      // 思考プロセスの翻訳を有効にするか
      thoughtTranslationModel: "gemini-2.5-flash-lite",
      dummyUser: "",
      dummyEnabled: true,
      applyDummyToProofread: false,
      applyDummyToTranslate: false,
      dummyModel: "",
      reverseDummyOrder: false,
      concatDummyModel: false,
      additionalModels: "",
      enterToSend: true,
      historySortOrder: "updatedAt",
      darkMode: false,
      backgroundImageBlob: null,
      fontFamily: "",
      hideSystemPromptInChat: false,
      enableSwipeNavigation: false,
      enableAutoRetry: true,
      maxRetries: 30,
      useFixedRetryDelay: false,
      fixedRetryDelaySeconds: 15,
      maxBackoffDelaySeconds: 60,
      enableApiTimeout: false,
      apiTimeoutSeconds: 90,
      enableProofreading: false,
      proofreadingModelName: "gemini-2.5-flash",
      proofreadingSystemInstruction: "あなたはプロの編集者です。受け取った文章の過剰な読点を抑制し、日本語として違和感のない読点の使用量に校正してください。承知しました等の応答は行わず、校正後の文章のみ出力して下さい。読点の抑制以外の編集は禁止です。読点以外の文章には絶対に手を付けないで下さい。",
      geminiEnableGrounding: false,
      geminiEnableFunctionCalling: false,
      googleSearchApiKey: "",
      googleSearchEngineId: "",
      messageOpacity: 1,
      overlayOpacity: 0.65,
      headerColor: "",
      allowPromptUiChanges: true,
      forceFunctionCalling: false,
      autoScroll: true,
      enableWideMode: true,
      enableMemory: false,
      memoryAutoSaveInterval: 30,
      headerAutoHide: false,
      summaryModelName: "",
      // 空の場合はmodelNameを使用
      summarySystemPrompt: `あなたはプロの編集者です。以下の会話履歴を、第三者の視点から見た物語の「あらすじ」として要約してください。
「承知しました」等のAIとしての応答は不要です。要約文のみ出力して下さい。

【最重要ルール】
- **プロットの維持**: 物語の重要な転換点、登場人物の重要な決断、新しい事実の判明、伏線となりうる発言は、絶対に省略しないでください。
- **客観的な記述**: 「主人公は〜した。」「〇〇は〜と感じた。」のように、キャラクターの行動と感情を客観的に記述してください。
- **情報の取捨選択**: 日常的な挨拶や、物語の進行に直接関係のない会話は省略してください。
- **時系列の維持**: 出来事が起こった順番を正確に保ってください。

最終的な出力は、このあらすじを初めて読む人でも、これまでの物語の流れを正確に理解できるような形式にしてください。`,
      enableSummaryButton: true,
      floatingPanelBehavior: "on-click",
      dropboxSyncFrequency: "instant",
      sdApiUrl: "",
      sdApiUser: "",
      sdApiPassword: "",
      sdEnableQualityChecker: false,
      sdQcModel: "gemini-2.5-pro",
      sdQcPrompt: `あなたはプロンプトと画像を比較し、指示通りに生成されているか評価する専門家です。
以下のプロンプトと画像の内容を厳密に比較してください。

[プロンプト]
{prompt}

[評価ルール]
- プロンプトの要素（人物、服装、背景、構図、雰囲気など）が画像内に明確に反映されていれば "OK" と評価してください。
- 重要な要素が欠けていたり、指示と明らかに異なる場合は "NG" と評価し、その理由を簡潔に説明してください。

[出力形式]
評価結果を以下の形式で出力してください。他のテキストは一切含めないでください。
Result: [OKまたはNG]
Reason: [NGの場合の理由]`,
      sdQcRetries: 3,
      sdPromptImproveModel: "gemini-2.5-flash",
      sdPromptImproveSystemPrompt: `あなたはプロのプロンプトエンジニアです。提示された「元のプロンプト」と「失敗理由」に基づき、失敗理由を解決するための改善された英語の画像生成プロンプトを生成してください。余計な解説や前置きは一切含めず、改善されたプロンプト本体のみを出力してください。`,
      debugMode: false
    },
    syncMessageCounter: 0,
    backgroundImageUrl: null,
    isSending: false,
    abortController: null,
    editingMessageIndex: null,
    isEditingSystemPrompt: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    isSwiping: false,
    isZoomed: false,
    currentScreen: "chat",
    panelFadeOutTimer: null,
    selectedFilesForUpload: [],
    pendingAttachments: [],
    isTemporaryBackgroundActive: false,
    currentScene: null,
    currentStyleProfiles: {},
    isMemoryEnabledForChat: true,
    characterProfileVisibleCharacter: null,
    rangeImageSelect: { active: false, startIndex: null, endIndex: null },
    // 範囲画像保存モードの選択状態
    sync: {
      isDirty: false,
      // ローカルに変更があったか
      lastSyncId: null,
      // 最後に同期したクラウドのID
      isSyncing: false,
      // 同期処理中か
      pushTimeoutId: null,
      // Push処理のデバウンス用タイマーID
      lastError: null
    }
  };

  // src/db-migrations.js
  var BASE_STORES = [
    { name: SETTINGS_STORE, options: { keyPath: "key" } },
    {
      name: CHATS_STORE,
      options: { keyPath: "id", autoIncrement: true },
      indexes: [
        { name: CHAT_UPDATEDAT_INDEX, keyPath: "updatedAt", options: { unique: false } },
        { name: CHAT_CREATEDAT_INDEX, keyPath: "createdAt", options: { unique: false } }
      ]
    },
    { name: PROFILES_STORE, options: { keyPath: "id", autoIncrement: true } },
    { name: "image_assets", options: { keyPath: "name" } },
    // Phase 4: プロジェクト機能のストア
    { name: PROJECTS_STORE, options: { keyPath: "id", autoIncrement: true } }
  ];
  var PROFILE_SETTING_KEYS = [
    "apiProvider",
    "apiKey",
    "zaiApiKey",
    "bedrockAccessKey",
    "bedrockSecretKey",
    "bedrockRegion",
    "modelName",
    "systemPrompt",
    "temperature",
    "maxTokens",
    "topK",
    "topP",
    "presencePenalty",
    "frequencyPenalty",
    "thinkingBudget",
    "includeThoughts",
    "enableThoughtTranslation",
    "thoughtTranslationModel",
    "dummyUser",
    "applyDummyToProofread",
    "applyDummyToTranslate",
    "dummyModel",
    "reverseDummyOrder",
    "concatDummyModel",
    "additionalModels",
    "enterToSend",
    "historySortOrder",
    "darkMode",
    "fontFamily",
    "hideSystemPromptInChat",
    "enableSwipeNavigation",
    "enableAutoRetry",
    "maxRetries",
    "useFixedRetryDelay",
    "fixedRetryDelaySeconds",
    "maxBackoffDelaySeconds",
    "enableProofreading",
    "proofreadingModelName",
    "proofreadingSystemInstruction",
    "geminiEnableGrounding",
    "geminiEnableFunctionCalling",
    "googleSearchApiKey",
    "googleSearchEngineId",
    "messageOpacity",
    "overlayOpacity",
    "headerColor",
    "allowPromptUiChanges",
    "forceFunctionCalling",
    "anthropicEffort"
  ];
  function createStore(db, def) {
    if (db.objectStoreNames.contains(def.name)) return;
    const store = db.createObjectStore(def.name, def.options);
    for (const idx of def.indexes || []) {
      store.createIndex(idx.name, idx.keyPath, idx.options);
    }
  }
  __name(createStore, "createStore");
  function applyDbMigrations(db, transaction, event, deps = {}) {
    const { settingsDefaults = {}, migrateImageData = /* @__PURE__ */ __name(() => {
    }, "migrateImageData") } = deps;
    console.log(`[DB Migration] IndexedDBをバージョン ${event.oldVersion} から ${event.newVersion} へアップグレード中...`);
    for (const def of BASE_STORES) {
      createStore(db, def);
    }
    if (event.oldVersion < 10) {
      console.log("[DB Migration] v10へのデータ移行処理を実行します。");
      const settingsStore = transaction.objectStore(SETTINGS_STORE);
      const profilesStore = transaction.objectStore(PROFILES_STORE);
      const getAllSettingsReq = settingsStore.getAll();
      getAllSettingsReq.onsuccess = () => {
        const oldSettingsArray = getAllSettingsReq.result;
        if (oldSettingsArray.length > 0) {
          console.log("[DB Migration] 既存の設定を検出しました。新しいプロファイル構造に移行します...");
          const oldSettingsObject = {};
          oldSettingsArray.forEach((item) => {
            oldSettingsObject[item.key] = item.value;
          });
          const newProfileSettings = {};
          PROFILE_SETTING_KEYS.forEach((key) => {
            newProfileSettings[key] = oldSettingsObject[key] !== void 0 ? oldSettingsObject[key] : settingsDefaults[key];
          });
          const defaultProfile = {
            name: "デフォルトプロファイル",
            icon: null,
            createdAt: Date.now(),
            settings: newProfileSettings
          };
          const addProfileReq = profilesStore.add(defaultProfile);
          addProfileReq.onsuccess = (addEvent) => {
            const newProfileId = addEvent.target.result;
            console.log(`[DB Migration] デフォルトプロファイルを生成しました (ID: ${newProfileId})`);
            PROFILE_SETTING_KEYS.forEach((key) => {
              settingsStore.delete(key);
            });
            settingsStore.put({ key: "activeProfileId", value: newProfileId });
            console.log(`[DB Migration] SETTINGS_STOREを整理し、activeProfileIdを設定しました。`);
          };
        }
      };
    }
    if (event.oldVersion < 11) {
      console.log("[DB Migration] v11へのアップグレード: image_storeを作成します。");
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
      transaction.oncomplete = () => {
        console.log("[DB Migration] スキーマ更新完了。データ移行処理を開始します。");
        migrateImageData();
      };
    }
    if (event.oldVersion < 12) {
      console.log("[DB Migration] v12へのアップグレード: memory_storeを作成します。");
      if (!db.objectStoreNames.contains("memory_store")) {
        db.createObjectStore("memory_store", { keyPath: "profileId" });
      }
    }
    if (event.oldVersion < 13) {
      console.log("[DB Migration] v13へのアップグレード: 安全なインポート用の一時ストアを作成します。");
      const tempStores = [
        { name: `${PROFILES_STORE}_temp`, options: { keyPath: "id" } },
        { name: `${CHATS_STORE}_temp`, options: { keyPath: "id" } },
        { name: `${SETTINGS_STORE}_temp`, options: { keyPath: "key" } },
        { name: `${IMAGE_STORE}_temp`, options: { keyPath: "id" } },
        { name: "image_assets_temp", options: { keyPath: "name" } },
        { name: "memory_store_temp", options: { keyPath: "profileId" } }
      ];
      tempStores.forEach((storeInfo) => {
        if (!db.objectStoreNames.contains(storeInfo.name)) {
          db.createObjectStore(storeInfo.name, storeInfo.options);
          console.log(`[DB Migration] Temporary store '${storeInfo.name}' created.`);
        }
      });
    }
    if (event.oldVersion < 15) {
      console.log("[DB Migration] v15へのアップグレード: projects_tempストアを作成します。");
      if (!db.objectStoreNames.contains("projects_temp")) {
        db.createObjectStore("projects_temp", { keyPath: "id" });
        console.log("[DB Migration] 'projects_temp' store created.");
      }
    }
  }
  __name(applyDbMigrations, "applyDbMigrations");

  // src/debug-logger.js
  var DebugLogger = {
    logs: [],
    MAX_LOGS: 500,
    originalConsole: {},
    isInitialized: false,
    init() {
      if (state.settings.debugMode) {
        this._patchConsole();
      } else {
        this._unpatchConsole();
      }
      this.isInitialized = true;
      console.log(
        `[DebugLogger] 初期化完了。デバッグモード: ${state.settings.debugMode ? "ON" : "OFF"}`
      );
    },
    _patchConsole() {
      if (this.originalConsole.log) return;
      const consoleMethods = ["log", "error", "warn", "info", "debug"];
      consoleMethods.forEach((method) => {
        this.originalConsole[method] = console[method];
        console[method] = (...args) => {
          this.addLog(method, args);
          this.originalConsole[method].apply(console, args);
        };
      });
    },
    _unpatchConsole() {
      if (!this.originalConsole.log) return;
      Object.keys(this.originalConsole).forEach((method) => {
        console[method] = this.originalConsole[method];
      });
      this.originalConsole = {};
    },
    addLog(type, args) {
      const serialize = /* @__PURE__ */ __name((obj) => {
        try {
          if (obj instanceof HTMLElement) return `[HTMLElement: ${obj.tagName}]`;
          if (obj instanceof Event) return `[Event: ${obj.type}]`;
          return JSON.stringify(
            obj,
            (key, value) => {
              if (typeof value === "object" && value !== null) {
                if (value instanceof Blob) return "[Blob]";
                if (value instanceof File) return `[File: ${value.name}]`;
              }
              return value;
            },
            2
          );
        } catch (e) {
          return "[Unserializable Object]";
        }
      }, "serialize");
      this.logs.push({
        type,
        timestamp: /* @__PURE__ */ new Date(),
        args: args.map(
          (arg) => typeof arg === "object" && arg !== null ? serialize(arg) : arg
        )
      });
      if (this.logs.length > this.MAX_LOGS) {
        this.logs.shift();
      }
    },
    getLogs() {
      return this.logs;
    },
    clearLogs() {
      this.logs = [];
      console.log("[DebugLogger] ログがクリアされました。");
    }
  };

  // src/utils/format.js
  var sleep = /* @__PURE__ */ __name((ms) => new Promise((resolve) => setTimeout(resolve, ms)), "sleep");
  function interruptibleSleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        const error = new Error("Sleep aborted");
        error.name = "AbortError";
        return reject(error);
      }
      let timeoutId;
      const onAbort = /* @__PURE__ */ __name(() => {
        clearTimeout(timeoutId);
        const error = new Error("Sleep aborted");
        error.name = "AbortError";
        reject(error);
      }, "onAbort");
      timeoutId = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
  __name(interruptibleSleep, "interruptibleSleep");
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  __name(formatFileSize, "formatFileSize");
  function base64ToBlob(base64, mimeType) {
    return fetch(`data:${mimeType};base64,${base64}`).then((res) => res.blob());
  }
  __name(base64ToBlob, "base64ToBlob");

  // src/utils/html.js
  var htmlUtils = {
    // HTML要素内のテキストコンテンツ用エスケープ
    escapeHtml(text) {
      if (text === null || text === void 0) return "";
      const div = document.createElement("div");
      div.textContent = String(text);
      return div.innerHTML;
    },
    // HTML属性値用エスケープ（より厳格）
    escapeAttr(text) {
      if (text === null || text === void 0) return "";
      return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    // CSSセレクタ用の安全な文字列を生成
    escapeSelector(text) {
      if (text === null || text === void 0) return "";
      return CSS.escape(String(text));
    },
    /**
     * Markdown を HTML 化し、DOMPurify でサニタイズして返す。
     * AI 応答・インポートされた履歴など信頼できない可能性のあるテキストを
     * innerHTML へ流し込む際は必ずこれを通すこと（XSS 対策）。
     *
     * - marked 未ロード時: HTML 化せずエスケープ（安全側）。
     * - DOMPurify 未ロード時: 生 HTML を描画せずエスケープ（安全側へフォールバック）。
     */
    renderMarkdownSafe(text) {
      const src = text == null ? "" : String(text);
      if (typeof marked === "undefined") {
        return this.escapeHtml(src);
      }
      const rawHtml = marked.parse(src);
      if (typeof DOMPurify === "undefined") {
        return this.escapeHtml(src);
      }
      return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ["target"] });
    }
  };

  // src/ui.js
  var uiUtils = {
    setLoadingIndicatorText(text) {
      elements.loadingIndicator.textContent = text;
    },
    // APIタイムアウトオプションの表示/非表示を制御
    updateApiTimeoutOptionsVisibility() {
      const isEnabled = elements.enableApiTimeoutCheckbox.checked;
      elements.apiTimeoutOptions.style.display = isEnabled ? "block" : "none";
      elements.apiTimeoutSecondsInput.disabled = !isEnabled;
    },
    // オーバーレイの透明度を適用
    applyOverlayOpacity() {
      const opacityValue = state.settings.overlayOpacity ?? 0.75;
      document.documentElement.style.setProperty("--overlay-opacity-value", opacityValue);
      console.log(`オーバーレイ透明度適用: ${opacityValue}`);
    },
    // ===== 範囲画像保存モードの表示制御 =====
    clearRangeImageHighlight() {
      elements.messageContainer?.querySelectorAll(".message.range-selected").forEach((el) => el.classList.remove("range-selected"));
    },
    updateRangeImageSelectionUI() {
      const sel = state.rangeImageSelect;
      const bar = elements.rangeImageBar;
      if (!sel || !sel.active) {
        bar?.classList.add("hidden");
        return;
      }
      bar?.classList.remove("hidden");
      this.clearRangeImageHighlight();
      let count = 0;
      if (sel.startIndex !== null) {
        const end = sel.endIndex === null ? sel.startIndex : sel.endIndex;
        const a = Math.min(sel.startIndex, end);
        const b = Math.max(sel.startIndex, end);
        for (let i = a; i <= b; i++) {
          const el = elements.messageContainer?.querySelector(`.message[data-index="${i}"]`);
          if (el) {
            el.classList.add("range-selected");
            count++;
          }
        }
      }
      if (elements.rangeImageInfo) {
        elements.rangeImageInfo.textContent = sel.startIndex === null ? "開始メッセージをタップ" : sel.endIndex === null ? "終了メッセージをタップ（タップで範囲を伸縮）" : `${count}件を選択中（タップで範囲変更）`;
      }
      if (elements.rangeImageSaveConfirmBtn) {
        elements.rangeImageSaveConfirmBtn.disabled = sel.startIndex === null;
      }
    },
    // 新しいメッセージ要素をコンテナの末尾に追加する（ちらつき防止用）
    appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
      const messageElement = this.createMessageElement(role, content, index, isStreamingPlaceholder, cascadeInfo, attachments);
      if (messageElement) {
        elements.messageContainer.appendChild(messageElement);
        if (window.Prism) {
          messageElement.querySelectorAll("pre code").forEach((block) => {
            Prism.highlightElement(block);
          });
        }
      }
    },
    renderChatMessages() {
      const renderStartTime = performance.now();
      const container = elements.messageContainer;
      container.style.minHeight = `${container.scrollHeight}px`;
      if (state.imageUrlCache.size > 0) {
        for (const url of state.imageUrlCache.values()) {
          URL.revokeObjectURL(url);
        }
        state.imageUrlCache.clear();
      }
      if (state.editingMessageIndex !== null) {
        const messageElement = container.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
        if (messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
        else state.editingMessageIndex = null;
      }
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();
      const visibleMessages = appLogic.getVisibleMessages();
      const summaryEndIndex = state.currentSummarizedContext?.summaryRange?.end;
      let markerInserted = false;
      visibleMessages.forEach((msg) => {
        const index = state.currentMessages.indexOf(msg);
        if (index === -1 || msg.role === "tool") return;
        if (!markerInserted && summaryEndIndex !== void 0 && index >= summaryEndIndex) {
          const markerDiv = document.createElement("div");
          markerDiv.className = "summary-marker";
          const markerText = document.createElement("span");
          markerText.className = "summary-marker-text";
          const summarizedDate = new Date(state.currentSummarizedContext.summarizedAt).toLocaleString("ja-JP");
          markerText.textContent = `ここまで要約済み (${summarizedDate})`;
          markerDiv.appendChild(markerText);
          fragment.appendChild(markerDiv);
          markerInserted = true;
        }
        let cascadeInfo = null;
        if (msg.isCascaded && msg.siblingGroupId) {
          const siblings = state.currentMessages.filter((m) => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
          const currentIndexInGroup = siblings.findIndex((m) => m === msg);
          cascadeInfo = {
            currentIndex: currentIndexInGroup + 1,
            total: siblings.length,
            siblingGroupId: msg.siblingGroupId
          };
        }
        const messageElement = uiUtils.createMessageElement(msg.role, msg.content, index, false, cascadeInfo, msg.attachments);
        if (messageElement) {
          fragment.appendChild(messageElement);
        }
      });
      if (!markerInserted && summaryEndIndex !== void 0 && state.currentMessages.length > 0 && state.currentMessages.length <= summaryEndIndex) {
        const markerDiv = document.createElement("div");
        markerDiv.className = "summary-marker";
        const markerText = document.createElement("span");
        markerText.className = "summary-marker-text";
        const summarizedDate = new Date(state.currentSummarizedContext.summarizedAt).toLocaleString("ja-JP");
        markerText.textContent = `ここまで要約済み (${summarizedDate})`;
        markerDiv.appendChild(markerText);
        fragment.appendChild(markerDiv);
        markerInserted = true;
      }
      container.appendChild(fragment);
      if (window.Prism) {
        const highlightStartTime = performance.now();
        Prism.highlightAll();
        const highlightEndTime = performance.now();
      }
      requestAnimationFrame(() => {
        container.style.minHeight = "";
      });
      appLogic.updateSummarizeButtonState();
      const renderEndTime = performance.now();
    },
    createMessageElement(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
      const messageData = state.currentMessages[index];
      if (!messageData) return null;
      const summaryEndIndex = state.currentSummarizedContext?.summaryRange?.end;
      const isSummarized = summaryEndIndex !== void 0 && index < summaryEndIndex;
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", role);
      messageDiv.dataset.index = index;
      if (role === "user" || role === "model") {
        let turnNumber = 0;
        for (let i = 0; i <= index; i++) {
          const m = state.currentMessages[i];
          if (!m || m.isHidden || m.role === "tool" || m.role === "error") continue;
          if (m.isCascaded && !m.isSelected) continue;
          if (m.role === "user") turnNumber++;
        }
        messageDiv.dataset.turn = turnNumber;
        if (role === "model" && messageData.modelName) {
          messageDiv.dataset.model = messageData.modelName;
        }
        if (messageData.timestamp) {
          const t = new Date(messageData.timestamp);
          messageDiv.dataset.time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
        }
      }
      if (role === "model" && messageData && messageData.thoughtSummary) {
        const thoughtDetails = document.createElement("details");
        thoughtDetails.classList.add("thought-summary-details");
        const thoughtSummaryElem = document.createElement("summary");
        thoughtSummaryElem.textContent = "思考プロセス";
        thoughtDetails.appendChild(thoughtSummaryElem);
        const thoughtContentDiv = document.createElement("div");
        thoughtContentDiv.classList.add("thought-summary-content");
        if (isStreamingPlaceholder) {
          thoughtContentDiv.id = `streaming-thought-summary-${index}`;
        } else {
          try {
            thoughtContentDiv.innerHTML = htmlUtils.renderMarkdownSafe(messageData.thoughtSummary);
          } catch (e) {
            console.error("Thought Summary Markdownパースエラー:", e);
            thoughtContentDiv.textContent = messageData.thoughtSummary || "";
          }
        }
        thoughtDetails.appendChild(thoughtContentDiv);
        messageDiv.appendChild(thoughtDetails);
      }
      const contentDiv = document.createElement("div");
      contentDiv.classList.add("message-content");
      if (isStreamingPlaceholder) {
        contentDiv.id = `streaming-content-${index}`;
      }
      if (role === "user" && attachments && attachments.length > 0) {
        const details = document.createElement("details");
        details.classList.add("attachment-details");
        details.open = false;
        const summary = document.createElement("summary");
        summary.textContent = `添付ファイル (${attachments.length}件)`;
        details.appendChild(summary);
        const list = document.createElement("ul");
        list.classList.add("attachment-list");
        attachments.forEach((att) => {
          const listItem = document.createElement("li");
          const mimeType = att.mimeType || "";
          let previewElement;
          if (mimeType.startsWith("image/")) {
            previewElement = document.createElement("img");
            previewElement.className = "attachment-thumbnail";
            previewElement.alt = att.name;
            if (att.file instanceof Blob) {
              const objectURL = URL.createObjectURL(att.file);
              previewElement.src = objectURL;
              state.imageUrlCache.set(objectURL, true);
            } else if (att.base64Data) {
              base64ToBlob(att.base64Data, att.mimeType).then((blob) => {
                const objectURL = URL.createObjectURL(blob);
                previewElement.src = objectURL;
                state.imageUrlCache.set(objectURL, true);
              }).catch((err) => {
                console.error("Base64からサムネイル用Blobへの変換に失敗:", err);
                previewElement.alt = "プレビュー失敗";
              });
            }
          } else if (mimeType.startsWith("video/")) {
            previewElement = document.createElement("video");
            previewElement.className = "attachment-thumbnail";
            previewElement.muted = true;
            previewElement.playsInline = true;
            if (att.file instanceof Blob) {
              const objectURL = URL.createObjectURL(att.file);
              previewElement.src = objectURL;
              state.videoUrlCache.set(objectURL, true);
            } else if (att.base64Data) {
              base64ToBlob(att.base64Data, att.mimeType).then((blob) => {
                const objectURL = URL.createObjectURL(blob);
                previewElement.src = objectURL;
                state.videoUrlCache.set(objectURL, true);
              }).catch((err) => console.error("Base64から動画用Blobへの変換に失敗:", err));
            }
          } else {
            previewElement = document.createElement("span");
            previewElement.className = "attachment-thumbnail material-symbols-outlined";
            previewElement.style.display = "flex";
            previewElement.style.alignItems = "center";
            previewElement.style.justifyContent = "center";
            previewElement.textContent = "description";
          }
          if (previewElement.tagName === "IMG" || previewElement.tagName === "VIDEO") {
            previewElement.onclick = () => {
              const modalOverlay = document.getElementById("image-modal-overlay");
              const modalImg = document.getElementById("image-modal-img");
              if (modalOverlay && modalImg) {
                if (previewElement.tagName === "IMG") {
                  modalImg.src = previewElement.src;
                  modalOverlay.classList.remove("hidden");
                } else {
                  console.warn("動画のモーダル表示は現在サポートされていません。");
                }
              } else {
                console.error("画像拡大用のモーダル要素が見つかりません。");
              }
            };
          }
          const filenameSpan = document.createElement("span");
          filenameSpan.className = "attachment-filename";
          filenameSpan.textContent = att.name;
          filenameSpan.title = `${att.name} (${att.mimeType})`;
          listItem.appendChild(previewElement);
          listItem.appendChild(filenameSpan);
          list.appendChild(listItem);
        });
        details.appendChild(list);
        contentDiv.appendChild(details);
        if (content && content.trim() !== "") {
          const pre = document.createElement("pre");
          pre.textContent = content;
          pre.style.marginTop = "8px";
          contentDiv.appendChild(pre);
        }
      } else {
        try {
          if (content && (role === "model" || role === "user")) {
            if (role === "model" && !isStreamingPlaceholder && typeof marked !== "undefined") {
              contentDiv.innerHTML = htmlUtils.renderMarkdownSafe(content);
            } else {
              const pre = document.createElement("pre");
              pre.textContent = content;
              contentDiv.appendChild(pre);
            }
          } else if (role === "error") {
            const p = document.createElement("p");
            p.textContent = content;
            contentDiv.appendChild(p);
          }
        } catch (e) {
          console.error("Markdownパースエラー:", e);
          const pre = document.createElement("pre");
          pre.textContent = content;
          contentDiv.innerHTML = "";
          contentDiv.appendChild(pre);
        }
      }
      messageDiv.appendChild(contentDiv);
      const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
      if (role === "model" && messageData && messageData.imageIds && messageData.imageIds.length > 0) {
        let imageIndex = 0;
        const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
          if (imageIndex < messageData.imageIds.length) {
            const imageId = messageData.imageIds[imageIndex++];
            return `<img class="lazy-load-image" alt="生成画像（読み込み中...）" data-image-id="${imageId}">`;
          }
          return "";
        });
        contentDiv.innerHTML = replacedHtml;
        if (imageIndex < messageData.imageIds.length) {
          const fragment = document.createDocumentFragment();
          for (let i = imageIndex; i < messageData.imageIds.length; i++) {
            const imageId = messageData.imageIds[i];
            const img = document.createElement("img");
            img.className = "lazy-load-image";
            img.alt = "生成画像（読み込み中...）";
            img.dataset.imageId = imageId;
            fragment.appendChild(img);
          }
          contentDiv.appendChild(fragment);
        }
        requestAnimationFrame(() => {
          const newImages = contentDiv.querySelectorAll(".lazy-load-image");
          newImages.forEach((img) => appLogic.imageObserver.observe(img));
        });
      }
      if (role === "model") {
        contentDiv.querySelectorAll("pre").forEach((pre) => {
          if (pre.closest(".code-artifact")) return;
          const code = pre.querySelector("code");
          let lang = "";
          if (code) {
            const langClass = [...code.classList].find((c) => c.startsWith("language-"));
            if (langClass) lang = langClass.replace("language-", "");
          }
          const wrapper = document.createElement("div");
          wrapper.className = "code-artifact";
          const header = document.createElement("div");
          header.className = "code-artifact-header";
          const label = document.createElement("span");
          label.className = "code-artifact-lang";
          label.textContent = lang || "テキスト";
          const copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "code-artifact-copy";
          copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
          copyBtn.onclick = () => {
            const text = code ? code.textContent : pre.textContent;
            navigator.clipboard.writeText(text || "").then(() => {
              copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> コピー済';
              setTimeout(() => {
                copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
              }, 1500);
            }).catch(() => {
            });
          };
          header.appendChild(label);
          header.appendChild(copyBtn);
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(header);
          wrapper.appendChild(pre);
        });
      }
      if (role === "model" && messageData && messageData.groundingMetadata && (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0 || messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0)) {
        try {
          const details = document.createElement("details");
          details.classList.add("citation-details");
          const summary = document.createElement("summary");
          summary.textContent = "引用元/検索クエリ";
          details.appendChild(summary);
          let detailsHasContent = false;
          if (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) {
            const citationList = document.createElement("ul");
            citationList.classList.add("citation-list");
            const citationMap = /* @__PURE__ */ new Map();
            let displayIndexCounter = 1;
            if (messageData.groundingMetadata.groundingSupports) {
              messageData.groundingMetadata.groundingSupports.forEach((support) => {
                if (support.groundingChunkIndices) {
                  support.groundingChunkIndices.forEach((chunkIndex) => {
                    if (!citationMap.has(chunkIndex) && chunkIndex >= 0 && chunkIndex < messageData.groundingMetadata.groundingChunks.length) {
                      const chunk = messageData.groundingMetadata.groundingChunks[chunkIndex];
                      if (chunk?.web?.uri) {
                        citationMap.set(chunkIndex, {
                          uri: chunk.web.uri,
                          title: chunk.web.title || "タイトル不明",
                          displayIndex: displayIndexCounter++
                        });
                      }
                    }
                  });
                }
              });
            }
            const sortedCitations = Array.from(citationMap.entries()).sort(([, a], [, b]) => a.displayIndex - b.displayIndex);
            sortedCitations.forEach(([chunkIndex, citationInfo]) => {
              const listItem = document.createElement("li");
              const link = document.createElement("a");
              link.href = citationInfo.uri;
              link.textContent = `[${citationInfo.displayIndex}] ${citationInfo.title}`;
              link.title = citationInfo.title;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              listItem.appendChild(link);
              citationList.appendChild(listItem);
            });
            if (sortedCitations.length === 0) {
              messageData.groundingMetadata.groundingChunks.forEach((chunk, idx) => {
                if (chunk?.web?.uri) {
                  const listItem = document.createElement("li");
                  const link = document.createElement("a");
                  link.href = chunk.web.uri;
                  link.textContent = chunk.web.title || `ソース ${idx + 1}`;
                  link.title = chunk.web.title || "タイトル不明";
                  link.target = "_blank";
                  link.rel = "noopener noreferrer";
                  listItem.appendChild(link);
                  citationList.appendChild(listItem);
                }
              });
            }
            if (citationList.hasChildNodes()) {
              details.appendChild(citationList);
              detailsHasContent = true;
            }
          }
          if (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) {
            if (detailsHasContent) {
              const separator = document.createElement("hr");
              separator.style.marginTop = "10px";
              separator.style.marginBottom = "8px";
              separator.style.border = "none";
              separator.style.borderTop = "1px dashed var(--border-tertiary)";
              details.appendChild(separator);
            }
            const queryHeader = document.createElement("div");
            queryHeader.textContent = "検索に使用されたクエリ:";
            queryHeader.style.fontWeight = "500";
            queryHeader.style.marginTop = detailsHasContent ? "0" : "8px";
            queryHeader.style.marginBottom = "4px";
            queryHeader.style.fontSize = "11px";
            queryHeader.style.color = "var(--text-secondary)";
            details.appendChild(queryHeader);
            const queryList = document.createElement("ul");
            queryList.classList.add("search-query-list");
            queryList.style.listStyle = "none";
            queryList.style.paddingLeft = "0";
            queryList.style.margin = "0";
            queryList.style.fontSize = "11px";
            queryList.style.color = "var(--text-secondary)";
            messageData.groundingMetadata.webSearchQueries.forEach((query) => {
              const queryItem = document.createElement("li");
              queryItem.textContent = `• ${query}`;
              queryItem.style.marginBottom = "3px";
              queryList.appendChild(queryItem);
            });
            details.appendChild(queryList);
            detailsHasContent = true;
          }
          if (detailsHasContent) {
            contentDiv.appendChild(details);
          }
        } catch (e) {
          console.error(`引用元/検索クエリ表示の生成中にエラーが発生しました (index: ${index}):`, e);
        }
      }
      if (role === "model" && messageData && messageData.executedFunctions && messageData.executedFunctions.length > 0) {
        const details = document.createElement("details");
        details.classList.add("function-call-details");
        const uniqueFunctions = [...new Set(messageData.executedFunctions)];
        const summary = document.createElement("summary");
        summary.innerHTML = `⚙️ ツール使用 (${uniqueFunctions.length}件)`;
        details.appendChild(summary);
        const list = document.createElement("ul");
        list.classList.add("function-call-list");
        uniqueFunctions.forEach((funcName) => {
          const listItem = document.createElement("li");
          listItem.textContent = funcName;
          list.appendChild(listItem);
        });
        details.appendChild(list);
        if (contentDiv.innerHTML.trim() !== "") {
          contentDiv.appendChild(details);
        } else {
          messageDiv.appendChild(details);
        }
      }
      if (role === "model" && messageData && messageData.search_web_results && messageData.search_web_results.length > 0) {
        const details = document.createElement("details");
        details.classList.add("function-call-details");
        const summary = document.createElement("summary");
        summary.innerHTML = `🌐 Web検索結果 (${messageData.search_web_results.length}件)`;
        details.appendChild(summary);
        const list = document.createElement("ul");
        list.classList.add("function-call-list");
        messageData.search_web_results.forEach((result) => {
          const listItem = document.createElement("li");
          const link = document.createElement("a");
          link.href = result.link;
          link.textContent = result.title;
          link.title = result.snippet;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          listItem.appendChild(link);
          list.appendChild(listItem);
        });
        details.appendChild(list);
        if (contentDiv.innerHTML.trim() !== "") {
          contentDiv.appendChild(details);
        } else {
          messageDiv.appendChild(details);
        }
      }
      if (role === "model" && messageData && messageData.generated_videos && messageData.generated_videos.length > 0) {
        const videoData = messageData.generated_videos[0];
        if (videoData && (videoData.url || videoData.base64Data)) {
          const video = document.createElement("video");
          video.controls = true;
          video.playsInline = true;
          video.muted = true;
          video.loop = true;
          video.style.maxWidth = "100%";
          video.style.borderRadius = "var(--border-radius-md)";
          video.style.display = "block";
          if (videoData.url) {
            video.src = videoData.url;
          } else if (videoData.base64Data) {
            base64ToBlob(videoData.base64Data, "video/mp4").then((blob) => {
              const objectURL = URL.createObjectURL(blob);
              video.src = objectURL;
            }).catch((err) => {
              console.error("Base64からの動画Blob生成に失敗:", err);
              video.remove();
            });
          }
          const placeholderRegex = /\[VIDEO_HERE\]/g;
          if (placeholderRegex.test(contentDiv.innerHTML)) {
            let replaced = false;
            contentDiv.innerHTML = contentDiv.innerHTML.replace(placeholderRegex, (match) => {
              if (!replaced) {
                replaced = true;
                return video.outerHTML;
              }
              return "";
            });
          }
        }
      }
      const editArea = document.createElement("div");
      editArea.classList.add("message-edit-area", "hidden");
      messageDiv.appendChild(editArea);
      if (role === "model" && cascadeInfo && cascadeInfo.total > 1) {
        const cascadeControlsDiv = document.createElement("div");
        cascadeControlsDiv.classList.add("message-cascade-controls");
        const prevButton = document.createElement("button");
        prevButton.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
        prevButton.title = "前の応答";
        prevButton.classList.add("cascade-prev-btn");
        prevButton.disabled = cascadeInfo.currentIndex <= 1;
        prevButton.onclick = () => appLogic.navigateCascade(index, "prev");
        cascadeControlsDiv.appendChild(prevButton);
        const indicatorSpan = document.createElement("span");
        indicatorSpan.classList.add("cascade-indicator");
        indicatorSpan.textContent = `${cascadeInfo.currentIndex}/${cascadeInfo.total}`;
        cascadeControlsDiv.appendChild(indicatorSpan);
        const nextButton = document.createElement("button");
        nextButton.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
        nextButton.title = "次の応答";
        nextButton.classList.add("cascade-next-btn");
        nextButton.disabled = cascadeInfo.currentIndex >= cascadeInfo.total;
        nextButton.onclick = () => appLogic.navigateCascade(index, "next");
        cascadeControlsDiv.appendChild(nextButton);
        const deleteCascadeButton = document.createElement("button");
        deleteCascadeButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteCascadeButton.title = "この応答を削除";
        deleteCascadeButton.classList.add("cascade-delete-btn");
        deleteCascadeButton.onclick = () => appLogic.confirmDeleteCascadeResponse(index);
        cascadeControlsDiv.appendChild(deleteCascadeButton);
        messageDiv.appendChild(cascadeControlsDiv);
      }
      if (role !== "error") {
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("message-actions");
        if (!isSummarized) {
          const editButton = document.createElement("button");
          editButton.innerHTML = '<span class="material-symbols-outlined">edit</span> 編集';
          editButton.title = "メッセージを編集";
          editButton.classList.add("js-edit-btn");
          editButton.onclick = () => appLogic.startEditMessage(index, messageDiv);
          actionsDiv.appendChild(editButton);
          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span> 削除';
          deleteButton.title = "この会話ターンを削除";
          deleteButton.classList.add("js-delete-btn");
          deleteButton.onclick = () => appLogic.deleteMessage(index);
          actionsDiv.appendChild(deleteButton);
          const copyButton = document.createElement("button");
          copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
          copyButton.title = "メッセージをコピー";
          copyButton.classList.add("js-copy-btn");
          copyButton.onclick = () => {
            const msg = state.currentMessages[index];
            if (!msg) return;
            navigator.clipboard.writeText(msg.content || "").then(() => {
              copyButton.innerHTML = '<span class="material-symbols-outlined">check</span> コピー済';
              setTimeout(() => {
                copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
              }, 1500);
            });
          };
          actionsDiv.appendChild(copyButton);
          if (role === "user") {
            const retryButton = document.createElement("button");
            retryButton.innerHTML = '<span class="material-symbols-outlined">replay</span> 再生成';
            retryButton.title = "このメッセージから再生成";
            retryButton.classList.add("js-retry-btn");
            retryButton.onclick = () => appLogic.retryFromMessage(index);
            actionsDiv.appendChild(retryButton);
          }
        }
        if (role === "model" && messageData?.usageMetadata && typeof messageData.usageMetadata.candidatesTokenCount === "number" && typeof messageData.usageMetadata.totalTokenCount === "number") {
          const usage = messageData.usageMetadata;
          const tokenSpan = document.createElement("span");
          tokenSpan.classList.add("token-count-display");
          let finalTotalTokenCount = usage.totalTokenCount;
          if (typeof messageData.usageMetadata.thoughtsTokenCount === "number") {
            finalTotalTokenCount -= messageData.usageMetadata.thoughtsTokenCount;
          }
          const formattedCandidates = usage.candidatesTokenCount.toLocaleString("en-US");
          const formattedTotal = finalTotalTokenCount.toLocaleString("en-US");
          const cacheRead = usage.cacheReadInputTokens || 0;
          const cacheWrite = usage.cacheCreationInputTokens || 0;
          const toK = /* @__PURE__ */ __name((n) => n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n), "toK");
          tokenSpan.textContent = `${formattedCandidates} / ${formattedTotal}`;
          if (cacheRead > 0 || cacheWrite > 0) {
            const cacheSpan = document.createElement("span");
            cacheSpan.classList.add("token-cache-display");
            let cacheParts = [];
            if (cacheRead > 0) cacheParts.push(`💾${toK(cacheRead)}`);
            if (cacheWrite > 0) cacheParts.push(`✏️${toK(cacheWrite)}`);
            cacheSpan.textContent = cacheParts.join(" ");
            tokenSpan.appendChild(document.createElement("br"));
            tokenSpan.appendChild(cacheSpan);
          }
          tokenSpan.title = `出力 / 合計トークン${cacheRead > 0 ? ` | キャッシュ読取: ${cacheRead.toLocaleString("en-US")}` : ""}${cacheWrite > 0 ? ` | キャッシュ書込: ${cacheWrite.toLocaleString("en-US")}` : ""}`;
          actionsDiv.appendChild(tokenSpan);
        }
        if (role === "model" && typeof messageData?.retryCount === "number" && messageData.retryCount > 0) {
          const retrySpan = document.createElement("span");
          retrySpan.classList.add("token-count-display");
          retrySpan.textContent = `(リトライ: ${messageData.retryCount}回)`;
          retrySpan.title = `APIリクエストを${messageData.retryCount}回再試行した結果です`;
          if (actionsDiv.querySelector(".token-count-display")) {
            retrySpan.style.marginLeft = "8px";
          }
          actionsDiv.appendChild(retrySpan);
        }
        if (actionsDiv.hasChildNodes()) {
          messageDiv.appendChild(actionsDiv);
        }
      }
      if (isStreamingPlaceholder) {
        messageDiv.id = `streaming-message-${index}`;
      }
      return messageDiv;
    },
    // エラーメッセージを表示
    displayError(message, isApiError = false) {
      console.error("エラー表示:", message);
      const errorIndex = state.currentMessages.length;
      this.appendMessage("error", `エラー: ${message}`, errorIndex);
      elements.loadingIndicator.classList.add("hidden");
      this.setSendingState(false);
    },
    // チャットタイトルを更新
    updateChatTitle(definitiveTitle = null) {
      let titleText = "新規チャット";
      let baseTitle = "";
      let isNewChat = !state.currentChatId;
      if (state.currentChatId) {
        isNewChat = false;
        if (definitiveTitle !== null) {
          baseTitle = definitiveTitle;
        } else {
          const firstUserMessage = state.currentMessages.find((m) => m.role === "user" && !m.isHidden);
          if (firstUserMessage) {
            baseTitle = firstUserMessage.content;
          } else if (state.currentMessages.length > 0) {
            baseTitle = "チャット履歴";
          }
        }
        if (baseTitle) {
          const displayBase = baseTitle.startsWith(IMPORT_PREFIX) ? baseTitle.substring(IMPORT_PREFIX.length) : baseTitle;
          const truncated = displayBase.substring(0, CHAT_TITLE_LENGTH);
          titleText = truncated + (displayBase.length > CHAT_TITLE_LENGTH ? "..." : "");
          if (baseTitle.startsWith(IMPORT_PREFIX)) {
            titleText = IMPORT_PREFIX + titleText;
          }
        } else if (state.currentMessages.length > 0) {
          titleText = "チャット履歴";
        }
        if (titleText === "新規チャット" && state.currentMessages.length > 0) {
          titleText = "チャット履歴";
        }
      }
      const displayTitle = titleText;
      elements.chatTitle.textContent = displayTitle;
      document.title = `PWA-lily - ${titleText}`;
    },
    // タイムスタンプをフォーマット
    formatDate(timestamp) {
      if (!timestamp) return "";
      try {
        return new Intl.DateTimeFormat("ja-JP", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp));
      } catch (e) {
        console.warn("Intl.DateTimeFormatエラー:", e);
        const d = new Date(timestamp);
        return `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
    },
    // 履歴リストをレンダリング
    async renderHistoryList() {
      try {
        const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
        elements.historyList.querySelectorAll(".history-item:not(.js-history-item-template)").forEach((item) => item.remove());
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
        let oldChatsCount = 0;
        if (chats && chats.length > 0) {
          elements.noHistoryMessage.classList.add("hidden");
          const sortOrderText = state.settings.historySortOrder === "createdAt" ? "作成順" : "更新順";
          elements.historyTitle.textContent = `履歴一覧 (${sortOrderText})`;
          chats.forEach((chat) => {
            if (chat.updatedAt < sevenDaysAgo) {
              oldChatsCount++;
            }
            const li = elements.historyItemTemplate.cloneNode(true);
            li.classList.remove("js-history-item-template");
            li.dataset.chatId = chat.id;
            const titleText = chat.title || `履歴 ${chat.id}`;
            const titleEl = li.querySelector(".history-item-title");
            titleEl.textContent = titleText;
            titleEl.title = titleText;
            if (chat.stats) {
              const totalTokenText = chat.stats.totalTokens > 0 ? chat.stats.totalTokens.toLocaleString() : "0";
              const inputTokenText = chat.stats.inputTokens > 0 ? chat.stats.inputTokens.toLocaleString() : "0";
              const outputTokenText = chat.stats.outputTokens > 0 ? chat.stats.outputTokens.toLocaleString() : "0";
              li.querySelector(".js-stat-tokens").innerHTML = `<span class="material-symbols-outlined">token</span>${totalTokenText} (入:${inputTokenText} / 出:${outputTokenText})`;
              li.querySelector(".js-stat-assets").innerHTML = `<span class="material-symbols-outlined">perm_media</span>${chat.stats.assetCount > 0 ? chat.stats.assetCount.toLocaleString() : "0"}`;
              li.querySelector(".js-stat-size").innerHTML = `<span class="material-symbols-outlined">database</span>${chat.stats.totalAssetSize > 0 ? formatFileSize(chat.stats.totalAssetSize) : "0 B"}`;
            } else {
              li.querySelector(".history-item-stats").style.display = "none";
            }
            li.querySelector(".created-date").textContent = `作成: ${this.formatDate(chat.createdAt)}`;
            li.querySelector(".updated-date").textContent = `更新: ${this.formatDate(chat.updatedAt)}`;
            li.onclick = async (event) => {
              if (!event.target.closest(".history-item-actions button")) {
                const screenTransitionPromise = uiUtils.showScreen("chat");
                const loadChatPromise = appLogic.loadChat(chat.id);
                await Promise.all([screenTransitionPromise, loadChatPromise]);
              }
            };
            li.querySelector(".js-edit-title-btn").onclick = (e) => {
              e.stopPropagation();
              appLogic.editHistoryTitle(chat.id, titleEl);
            };
            li.querySelector(".js-export-btn").onclick = (e) => {
              e.stopPropagation();
              appLogic.exportChat(chat.id, titleText);
            };
            li.querySelector(".js-duplicate-btn").onclick = (e) => {
              e.stopPropagation();
              appLogic.duplicateChat(chat.id);
            };
            li.querySelector(".js-delete-btn").onclick = (e) => {
              e.stopPropagation();
              appLogic.confirmDeleteChat(chat.id, titleText);
            };
            elements.historyList.appendChild(li);
          });
        } else {
          elements.noHistoryMessage.classList.remove("hidden");
          elements.historyTitle.textContent = "履歴一覧";
          const pEl = elements.noHistoryMessage.querySelector("p") || elements.noHistoryMessage;
          const restoreBtn = document.getElementById("restore-from-cloud-btn");
          const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
          const totalChats = await getAllUnfiltered();
          if (totalChats.length > 0) {
            pEl.textContent = "このプロジェクトにチャットはありません。";
            if (restoreBtn) restoreBtn.classList.add("hidden");
          } else {
            pEl.textContent = "チャット履歴はありません。";
            if (restoreBtn) {
              dbUtils.getSetting("dropboxTokens").then((tok) => {
                restoreBtn.classList.toggle("hidden", !(tok && tok.value));
              });
            }
          }
        }
        const deleteBtn = document.getElementById("delete-old-chats-btn");
        if (oldChatsCount > 0) {
          deleteBtn.disabled = false;
          deleteBtn.title = `${oldChatsCount}件の古い履歴を一括削除`;
        } else {
          deleteBtn.disabled = true;
          deleteBtn.title = "削除対象の古い履歴はありません";
        }
      } catch (error) {
        console.error("履歴リストのレンダリングエラー:", error);
        const pEl = elements.noHistoryMessage.querySelector("p") || elements.noHistoryMessage;
        pEl.textContent = "履歴の読み込み中にエラーが発生しました。";
        elements.noHistoryMessage.classList.remove("hidden");
        elements.historyTitle.textContent = "履歴一覧";
      }
    },
    // --- 背景画像UIヘルパー ---
    // 既存のオブジェクトURLを破棄
    revokeExistingObjectUrl() {
      if (state.backgroundImageUrl) {
        try {
          URL.revokeObjectURL(state.backgroundImageUrl);
          console.log("以前の背景URLを破棄:", state.backgroundImageUrl);
        } catch (e) {
          console.error("オブジェクトURLの破棄エラー:", e);
        }
        state.backgroundImageUrl = null;
      }
    },
    // 背景画像設定UIを更新
    updateBackgroundSettingsUI() {
      if (!elements.backgroundThumbnail || !elements.deleteBackgroundBtn) return;
      if (state.backgroundImageUrl) {
        elements.backgroundThumbnail.src = state.backgroundImageUrl;
        elements.backgroundThumbnail.classList.remove("hidden");
        elements.deleteBackgroundBtn.classList.remove("hidden");
      } else {
        elements.backgroundThumbnail.src = "";
        elements.backgroundThumbnail.classList.add("hidden");
        elements.deleteBackgroundBtn.classList.add("hidden");
      }
    },
    applyHeaderColor() {
      const customColor = state.settings.headerColor;
      if (customColor) {
        document.documentElement.style.setProperty("--header-color-custom", customColor);
      } else {
        document.documentElement.style.removeProperty("--header-color-custom");
      }
      const finalHeaderColor = getComputedStyle(elements.appHeader).backgroundColor;
      elements.themeColorMeta.content = finalHeaderColor;
      console.log(`ヘッダーカラー適用。テーマカラー: ${finalHeaderColor}`);
    },
    applyBackgroundImage() {
      if (state.isTemporaryBackgroundActive) {
        console.log("一時的な背景が適用中のため、永続的な背景の適用をスキップしました。");
        return;
      }
      this.revokeExistingObjectUrl();
      const blob = state.settings.backgroundImageBlob;
      if (blob instanceof Blob) {
        try {
          state.backgroundImageUrl = URL.createObjectURL(blob);
          const newUrl = `url("${state.backgroundImageUrl}")`;
          const chatScreen = elements.chatScreen;
          const isAlreadyVisible = chatScreen.classList.contains("background-visible");
          const switchImageAndFadeIn = /* @__PURE__ */ __name(() => {
            document.documentElement.style.setProperty("--chat-background-image", newUrl);
            chatScreen.classList.add("background-visible");
          }, "switchImageAndFadeIn");
          if (isAlreadyVisible) {
            chatScreen.addEventListener("transitionend", switchImageAndFadeIn, { once: true });
            chatScreen.classList.remove("background-visible");
          } else {
            switchImageAndFadeIn();
          }
          console.log("背景画像をBlobから適用しました。");
        } catch (e) {
          console.error("背景画像のオブジェクトURL生成に失敗:", e);
          elements.chatScreen.classList.remove("background-visible");
          document.documentElement.style.removeProperty("--chat-background-image");
        }
      } else {
        elements.chatScreen.classList.remove("background-visible");
        document.documentElement.style.removeProperty("--chat-background-image");
      }
      this.updateBackgroundSettingsUI();
    },
    // ------------------------------------
    // 設定をUIに適用
    applySettingsToUI() {
      if (elements.apiProviderSelect) {
        const provider = state.settings.apiProvider || "gemini";
        elements.apiProviderSelect.value = provider;
        if (elements.apiProviderRow) {
          elements.apiProviderRow.classList.remove("hidden");
        }
        appLogic.updateProviderUI(provider);
        appLogic.updateModelOptions(provider);
      }
      elements.apiKeyInput.value = state.settings.apiKey || "";
      if (elements.zaiApiKeyInput) {
        elements.zaiApiKeyInput.value = state.settings.zaiApiKey || "";
      }
      if (elements.openrouterApiKeyInput) {
        elements.openrouterApiKeyInput.value = state.settings.openrouterApiKey || "";
      }
      if (elements.bedrockAccessKeyInput) {
        elements.bedrockAccessKeyInput.value = state.settings.bedrockAccessKey || "";
      }
      if (elements.bedrockSecretKeyInput) {
        elements.bedrockSecretKeyInput.value = state.settings.bedrockSecretKey || "";
      }
      if (elements.bedrockRegionSelect) {
        elements.bedrockRegionSelect.value = state.settings.bedrockRegion || DEFAULT_BEDROCK_REGION;
      }
      if (elements.openaiApiKeyInput) {
        elements.openaiApiKeyInput.value = state.settings.openaiApiKey || "";
      }
      if (elements.anthropicApiKeyInput) {
        elements.anthropicApiKeyInput.value = state.settings.anthropicApiKey || "";
      }
      if (elements.anthropicCacheTTLSelect) {
        elements.anthropicCacheTTLSelect.value = state.settings.anthropicCacheTTL || "5m";
      }
      if (elements.anthropicEffortSelect) {
        elements.anthropicEffortSelect.value = state.settings.anthropicEffort || "high";
      }
      if (elements.novelaiApiKeyInput) {
        elements.novelaiApiKeyInput.value = state.settings.novelaiApiKey || "";
      }
      if (elements.novelaiModelSelect) {
        elements.novelaiModelSelect.value = state.settings.novelaiModel || "nai-diffusion-4-5-curated";
      }
      if (elements.groqApiKeyInput) {
        elements.groqApiKeyInput.value = state.settings.groqApiKey || "";
      }
      if (elements.deepseekApiKeyInput) {
        elements.deepseekApiKeyInput.value = state.settings.deepseekApiKey || "";
      }
      if (elements.xaiApiKeyInput) {
        elements.xaiApiKeyInput.value = state.settings.xaiApiKey || "";
      }
      if (elements.sakanaApiKeyInput) {
        elements.sakanaApiKeyInput.value = state.settings.sakanaApiKey || "";
      }
      if (elements.mistralApiKeyInput) {
        elements.mistralApiKeyInput.value = state.settings.mistralApiKey || "";
      }
      elements.modelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
      elements.systemPromptDefaultTextarea.value = state.settings.systemPrompt || "";
      elements.temperatureInput.value = state.settings.temperature === null ? "" : state.settings.temperature;
      elements.maxTokensInput.value = state.settings.maxTokens === null ? "" : state.settings.maxTokens;
      elements.topKInput.value = state.settings.topK === null ? "" : state.settings.topK;
      elements.topPInput.value = state.settings.topP === null ? "" : state.settings.topP;
      elements.thinkingBudgetInput.value = state.settings.thinkingBudget === null ? "" : state.settings.thinkingBudget;
      elements.includeThoughtsToggle.checked = state.settings.includeThoughts;
      elements.enableThoughtTranslationCheckbox.checked = state.settings.enableThoughtTranslation;
      elements.thoughtTranslationModelSelect.value = state.settings.thoughtTranslationModel || "gemini-2.5-flash-lite";
      elements.thoughtTranslationOptionsDiv.classList.toggle("hidden", !state.settings.includeThoughts);
      elements.dummyUserInput.value = state.settings.dummyUser || "";
      if (elements.dummyEnabledToggle) elements.dummyEnabledToggle.checked = state.settings.dummyEnabled !== false;
      elements.applyDummyToProofreadCheckbox.checked = state.settings.applyDummyToProofread;
      elements.applyDummyToTranslateCheckbox.checked = state.settings.applyDummyToTranslate;
      elements.dummyModelInput.value = state.settings.dummyModel || "";
      elements.reverseDummyOrderCheckbox.checked = state.settings.reverseDummyOrder;
      elements.concatDummyModelCheckbox.checked = state.settings.concatDummyModel;
      elements.additionalModelsTextarea.value = state.settings.additionalModels || "";
      elements.enterToSendCheckbox.checked = state.settings.enterToSend;
      elements.historySortOrderSelect.value = state.settings.historySortOrder || "updatedAt";
      elements.darkModeToggle.checked = state.settings.darkMode;
      elements.debugModeToggle.checked = state.settings.debugMode;
      elements.fontFamilyInput.value = state.settings.fontFamily || "";
      elements.hideSystemPromptToggle.checked = state.settings.hideSystemPromptInChat;
      elements.geminiEnableGroundingToggle.checked = state.settings.geminiEnableGrounding;
      elements.geminiEnableFunctionCallingToggle.checked = state.settings.geminiEnableFunctionCalling;
      elements.swipeNavigationToggle.checked = state.settings.enableSwipeNavigation;
      elements.enableProofreadingCheckbox.checked = state.settings.enableProofreading;
      elements.proofreadingModelNameSelect.value = state.settings.proofreadingModelName || "gemini-2.5-flash";
      elements.proofreadingSystemInstructionTextarea.value = state.settings.proofreadingSystemInstruction || "";
      elements.proofreadingOptionsDiv.classList.toggle("hidden", !state.settings.enableProofreading);
      elements.enableAutoRetryCheckbox.checked = state.settings.enableAutoRetry;
      elements.maxRetriesInput.value = state.settings.maxRetries;
      elements.autoRetryOptionsDiv.classList.toggle("hidden", !state.settings.enableAutoRetry);
      elements.useFixedRetryDelayCheckbox.checked = state.settings.useFixedRetryDelay;
      elements.fixedRetryDelayInput.value = state.settings.fixedRetryDelaySeconds;
      elements.maxBackoffDelayInput.value = state.settings.maxBackoffDelaySeconds;
      elements.fixedRetryDelayContainer.classList.toggle("hidden", !state.settings.useFixedRetryDelay);
      elements.maxBackoffDelayContainer.classList.toggle("hidden", state.settings.useFixedRetryDelay);
      elements.enableApiTimeoutCheckbox.checked = state.settings.enableApiTimeout || false;
      elements.apiTimeoutSecondsInput.value = state.settings.apiTimeoutSeconds || 90;
      this.updateApiTimeoutOptionsVisibility();
      elements.googleSearchApiKeyInput.value = state.settings.googleSearchApiKey || "";
      elements.googleSearchEngineIdInput.value = state.settings.googleSearchEngineId || "";
      const opacityPercent = Math.round((state.settings.overlayOpacity ?? 0.65) * 100);
      if (elements.overlayOpacitySlider) elements.overlayOpacitySlider.value = opacityPercent;
      if (elements.overlayOpacityValue) elements.overlayOpacityValue.textContent = `${opacityPercent}%`;
      const msgPercent = Math.round((state.settings.messageOpacity ?? 1) * 100);
      if (elements.messageOpacitySlider) elements.messageOpacitySlider.value = msgPercent;
      if (elements.messageOpacityValue) elements.messageOpacityValue.textContent = `${msgPercent}%`;
      document.documentElement.style.setProperty("--message-bubble-opacity", String(state.settings.messageOpacity ?? 1));
      const promptUiCb = document.getElementById("allow-prompt-ui-changes");
      if (promptUiCb) promptUiCb.checked = state.settings.allowPromptUiChanges;
      elements.forceFunctionCallingToggle.checked = state.settings.forceFunctionCalling;
      elements.autoScrollToggle.checked = state.settings.autoScroll;
      elements.enableWideModeToggle.checked = state.settings.enableWideMode;
      elements.enableMemoryToggle.checked = state.settings.enableMemory;
      elements.memoryAutoSaveIntervalSelect.value = state.settings.memoryAutoSaveInterval;
      appLogic.toggleMemoryOptions(state.settings.enableMemory);
      elements.headerAutoHideToggle.checked = state.settings.headerAutoHide;
      elements.summaryModelNameSelect.value = state.settings.summaryModelName || state.settings.modelName || "gemini-2.5-flash";
      elements.summarySystemPromptTextarea.value = state.settings.summarySystemPrompt || "";
      elements.enableSummaryButtonToggle.checked = state.settings.enableSummaryButton;
      document.body.classList.toggle("header-auto-hide", state.settings.headerAutoHide);
      elements.floatingPanelBehaviorSelect.value = state.settings.floatingPanelBehavior || "on-click";
      elements.dropboxSyncFrequencySelect.value = state.settings.dropboxSyncFrequency || "instant";
      const defaultHeaderColor = state.settings.darkMode ? "#908675" : "#908675";
      elements.headerColorInput.value = state.settings.headerColor || defaultHeaderColor;
      this.updateUserModelOptions();
      this.updateBackgroundSettingsUI();
      this.applyDarkMode();
      this.applyFontFamily();
      this.toggleSystemPromptVisibility();
      this.applyOverlayOpacity();
      this.applyHeaderColor();
      this.updateModelWarningMessage();
      this.applyBackgroundImage();
      appLogic.applyWideMode();
      appLogic.toggleDebugLogButtonVisibility(state.settings.debugMode);
      elements.sdApiUrlInput.value = state.settings.sdApiUrl || "";
      elements.sdApiUserInput.value = state.settings.sdApiUser || "";
      elements.sdApiPasswordInput.value = state.settings.sdApiPassword || "";
      elements.sdEnableQualityCheckerCheckbox.checked = state.settings.sdEnableQualityChecker;
      elements.sdQcModelSelect.value = state.settings.sdQcModel || "gemini-2.5-pro";
      elements.sdQcPromptTextarea.value = state.settings.sdQcPrompt || "";
      elements.sdQcRetriesInput.value = state.settings.sdQcRetries === null ? "" : state.settings.sdQcRetries;
      elements.sdPromptImproveModelSelect.value = state.settings.sdPromptImproveModel || "gemini-2.5-flash";
      elements.sdPromptImproveSystemPromptTextarea.value = state.settings.sdPromptImproveSystemPrompt || "";
      elements.sdQualityCheckerOptionsDiv.classList.toggle("hidden", !state.settings.sdEnableQualityChecker);
    },
    // ユーザー指定モデルをコンボボックスに反映
    updateUserModelOptions() {
      const models = (state.settings.additionalModels || "").split(",").map((m) => m.trim()).filter((m) => m !== "");
      const targetGroups = [
        {
          groupId: "user-defined-models-group",
          selectElement: elements.modelNameSelect,
          currentValue: state.settings.modelName
        },
        {
          groupId: "thought-translation-user-models",
          selectElement: elements.thoughtTranslationModelSelect,
          currentValue: state.settings.thoughtTranslationModel
        },
        {
          groupId: "proofreading-user-models",
          selectElement: elements.proofreadingModelNameSelect,
          currentValue: state.settings.proofreadingModelName
        },
        {
          groupId: "sd-qc-user-models",
          selectElement: elements.sdQcModelSelect,
          currentValue: state.settings.sdQcModel
        },
        {
          groupId: "sd-prompt-improve-user-models",
          selectElement: elements.sdPromptImproveModelSelect,
          currentValue: state.settings.sdPromptImproveModel
        },
        {
          groupId: "summary-user-models",
          selectElement: elements.summaryModelNameSelect,
          currentValue: state.settings.summaryModelName || state.settings.modelName
        }
      ];
      targetGroups.forEach(({ groupId, selectElement, currentValue }) => {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.innerHTML = "";
        if (models.length > 0) {
          group.disabled = false;
          models.forEach((modelId) => {
            const option = document.createElement("option");
            option.value = modelId;
            option.textContent = modelId;
            group.appendChild(option);
          });
          if (models.includes(currentValue) && selectElement) {
            selectElement.value = currentValue;
          }
        } else {
          group.disabled = true;
        }
      });
    },
    // ダークモードを適用
    applyDarkMode() {
      const isDark = state.settings.darkMode;
      document.body.classList.toggle("dark-mode", isDark);
      document.body.classList.toggle("light-mode-forced", !isDark);
      elements.themeColorMeta.content = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
      console.log(`ダークモード ${isDark ? "有効" : "無効"}. テーマカラー: ${elements.themeColorMeta.content}`);
      this.applyOverlayOpacity();
      this.applyHeaderColor();
    },
    // フォント設定を適用
    applyFontFamily() {
      const customFont = state.settings.fontFamily?.trim();
      const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
      document.documentElement.style.setProperty("--font-family", fontFamilyToApply);
      console.log(`フォント適用: ${fontFamilyToApply}`);
    },
    // --- システムプロンプトUI更新 ---
    updateSystemPromptUI() {
      elements.systemPromptEditor.value = state.currentSystemPrompt;
      if (!state.isEditingSystemPrompt) {
        elements.systemPromptDetails.removeAttribute("open");
      }
      this.adjustTextareaHeight(elements.systemPromptEditor, 200);
      this.toggleSystemPromptVisibility();
    },
    // システムプロンプトエリアの表示/非表示を切り替え
    toggleSystemPromptVisibility() {
      const shouldHide = state.settings.hideSystemPromptInChat;
      elements.systemPromptArea.classList.toggle("hidden", shouldHide);
      console.log(`システムプロンプト表示エリア ${shouldHide ? "非表示" : "表示"}`);
    },
    // --------------------------------
    // 画面を表示 (スワイプアニメーション + inert対応 + 戻るボタン対応)
    showScreen(screenName, fromPopState = false) {
      return new Promise((resolve) => {
        const startTime = performance.now();
        if (screenName === state.currentScreen) {
          resolve();
          return;
        }
        const chat = elements.chatScreen;
        const historyEl = elements.historyScreen;
        const settings = elements.settingsScreen;
        const allScreens = [chat, historyEl, settings];
        const pos = {
          chat: {
            chat: "translate3d(0,0,0)",
            history: "translate3d(-100%,0,0)",
            settings: "translate3d(100%,0,0)"
          },
          history: {
            chat: "translate3d(100%,0,0)",
            history: "translate3d(0,0,0)",
            settings: "translate3d(200%,0,0)"
          },
          settings: {
            chat: "translate3d(-100%,0,0)",
            history: "translate3d(-200%,0,0)",
            settings: "translate3d(0,0,0)"
          }
        };
        if (screenName === "chat") {
          chat.style.transform = pos.chat.chat;
          historyEl.style.transform = pos.chat.history;
          settings.style.transform = pos.chat.settings;
        } else if (screenName === "history") {
          chat.style.transform = pos.history.chat;
          historyEl.style.transform = pos.history.history;
          settings.style.transform = pos.history.settings;
          this.renderHistoryList();
        } else if (screenName === "settings") {
          chat.style.transform = pos.settings.chat;
          historyEl.style.transform = pos.settings.history;
          settings.style.transform = pos.settings.settings;
        }
        void elements.appContainer.offsetHeight;
        let activeScreen = null;
        if (screenName === "chat") activeScreen = chat;
        else if (screenName === "history") activeScreen = historyEl;
        else if (screenName === "settings") activeScreen = settings;
        if (activeScreen) {
          activeScreen.classList.add("active");
          activeScreen.inert = false;
        }
        allScreens.forEach((s) => {
          if (s !== activeScreen) {
            s.classList.remove("active");
            s.inert = true;
          }
        });
        if (!fromPopState) {
          const entry = { screen: screenName };
          if (screenName === "chat" && state.__navSource === "history-item") {
            history.replaceState(entry, "", "#chat");
          } else {
            history.pushState(entry, "", `#${screenName}`);
          }
        }
        let finished = false;
        const finish = /* @__PURE__ */ __name(() => {
          if (finished) return;
          finished = true;
          state.currentScreen = screenName;
          const endTime = performance.now();
          resolve();
        }, "finish");
        requestAnimationFrame(() => requestAnimationFrame(finish));
        setTimeout(finish, 600);
      });
    },
    // 送信状態を設定
    setSendingState(sending) {
      state.isSending = sending;
      if (sending) {
        elements.sendButton.innerHTML = '<span class="material-symbols-outlined">stop</span>';
        elements.sendButton.classList.add("sending");
        elements.sendButton.title = "停止";
        elements.sendButton.disabled = false;
        elements.userInput.disabled = true;
        elements.attachFileBtn.disabled = true;
        elements.loadingIndicator.classList.remove("hidden");
        elements.loadingIndicator.setAttribute("aria-live", "polite");
        elements.systemPromptDetails.style.pointerEvents = "none";
        elements.systemPromptDetails.style.opacity = "0.7";
      } else {
        elements.sendButton.innerHTML = '<span class="material-symbols-outlined">send</span>';
        elements.sendButton.classList.remove("sending");
        elements.sendButton.title = "送信";
        elements.sendButton.disabled = elements.userInput.value.trim() === "" && state.pendingAttachments.length === 0;
        elements.userInput.disabled = false;
        elements.attachFileBtn.disabled = false;
        elements.loadingIndicator.classList.add("hidden");
        elements.loadingIndicator.removeAttribute("aria-live");
        elements.systemPromptDetails.style.pointerEvents = "";
        elements.systemPromptDetails.style.opacity = "";
      }
    },
    // テキストエリアの高さを自動調整
    adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
      if (textarea === elements.userInput && !state.isSending) {
        elements.sendButton.disabled = textarea.value.trim() === "" && state.pendingAttachments.length === 0;
      }
    },
    // --- カスタムダイアログ関数 ---
    showCustomDialog(dialogElement, focusElement) {
      return new Promise((resolve) => {
        const closeListener = /* @__PURE__ */ __name(() => {
          dialogElement.removeEventListener("close", closeListener);
          resolve(dialogElement.returnValue);
        }, "closeListener");
        dialogElement.addEventListener("close", closeListener);
        dialogElement.classList.add("animating");
        dialogElement.addEventListener("animationend", () => {
          dialogElement.classList.remove("animating");
        }, { once: true });
        dialogElement.showModal();
        if (focusElement) {
          requestAnimationFrame(() => {
            focusElement.focus();
          });
        }
      });
    },
    // アラートダイアログ表示
    async showCustomAlert(message) {
      elements.alertMessage.textContent = message;
      const newOkBtn = elements.alertOkBtn.cloneNode(true);
      elements.alertOkBtn.parentNode.replaceChild(newOkBtn, elements.alertOkBtn);
      elements.alertOkBtn = newOkBtn;
      elements.alertOkBtn.onclick = () => elements.alertDialog.close("ok");
      await this.showCustomDialog(elements.alertDialog, elements.alertOkBtn);
    },
    // 確認ダイアログ表示
    async showCustomConfirm(message) {
      elements.confirmMessage.textContent = message;
      const newOkBtn = elements.confirmOkBtn.cloneNode(true);
      elements.confirmOkBtn.parentNode.replaceChild(newOkBtn, elements.confirmOkBtn);
      elements.confirmOkBtn = newOkBtn;
      const newCancelBtn = elements.confirmCancelBtn.cloneNode(true);
      elements.confirmCancelBtn.parentNode.replaceChild(newCancelBtn, elements.confirmCancelBtn);
      elements.confirmCancelBtn = newCancelBtn;
      elements.confirmOkBtn.onclick = () => elements.confirmDialog.close("ok");
      elements.confirmCancelBtn.onclick = () => elements.confirmDialog.close("cancel");
      const result = await this.showCustomDialog(elements.confirmDialog, elements.confirmOkBtn);
      return result === "ok";
    },
    // プロンプトダイアログ表示
    async showCustomPrompt(message, defaultValue = "") {
      elements.promptMessage.textContent = message;
      elements.promptInput.value = defaultValue;
      const newOkBtn = elements.promptOkBtn.cloneNode(true);
      elements.promptOkBtn.parentNode.replaceChild(newOkBtn, elements.promptOkBtn);
      elements.promptOkBtn = newOkBtn;
      const newCancelBtn = elements.promptCancelBtn.cloneNode(true);
      elements.promptCancelBtn.parentNode.replaceChild(newCancelBtn, elements.promptCancelBtn);
      elements.promptCancelBtn = newCancelBtn;
      const newPromptInput = elements.promptInput.cloneNode(true);
      elements.promptInput.parentNode.replaceChild(newPromptInput, elements.promptInput);
      elements.promptInput = newPromptInput;
      const enterHandler = /* @__PURE__ */ __name((event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          elements.promptOkBtn.click();
        }
      }, "enterHandler");
      elements.promptInput.addEventListener("keypress", enterHandler);
      elements.promptOkBtn.onclick = () => elements.promptDialog.close(elements.promptInput.value);
      elements.promptCancelBtn.onclick = () => elements.promptDialog.close("");
      const closeHandler = /* @__PURE__ */ __name(() => {
        elements.promptInput.removeEventListener("keypress", enterHandler);
        elements.promptDialog.removeEventListener("close", closeHandler);
      }, "closeHandler");
      elements.promptDialog.addEventListener("close", closeHandler);
      const result = await this.showCustomDialog(elements.promptDialog, elements.promptInput);
      return result;
    },
    // 添付ファイルバッジの表示/非表示を更新する関数
    updateAttachmentBadgeVisibility() {
      const hasAttachments = state.pendingAttachments.length > 0;
      elements.attachFileBtn.classList.toggle("has-attachments", hasAttachments);
    },
    // ファイルアップロードダイアログ表示
    showFileUploadDialog() {
      if (state.selectedFilesForUpload.length === 0 && state.pendingAttachments.length > 0) {
        state.selectedFilesForUpload = state.pendingAttachments.map((att) => ({ file: att.file }));
        console.log("送信待ちの添付ファイルをダイアログに復元:", state.selectedFilesForUpload.map((item) => item.file.name));
      } else if (state.selectedFilesForUpload.length === 0) {
        state.selectedFilesForUpload = [];
      }
      this.updateSelectedFilesUI();
      elements.fileUploadDialog.showModal();
      this.updateAttachmentBadgeVisibility();
    },
    // 選択されたファイルリストのUIを更新 (変更なし、呼び出しタイミングが重要)
    updateSelectedFilesUI() {
      elements.selectedFilesList.innerHTML = "";
      let totalSize = 0;
      state.selectedFilesForUpload.forEach((item, index) => {
        const li = document.createElement("li");
        li.classList.add("selected-file-item");
        li.dataset.fileIndex = index;
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("selected-file-info");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("selected-file-name");
        nameSpan.textContent = item.file.name;
        nameSpan.title = item.file.name;
        const sizeSpan = document.createElement("span");
        sizeSpan.classList.add("selected-file-size");
        sizeSpan.textContent = formatFileSize(item.file.size);
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(sizeSpan);
        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-file-btn");
        removeBtn.title = "削除";
        removeBtn.textContent = "×";
        removeBtn.onclick = () => appLogic.removeSelectedFile(index);
        li.appendChild(infoDiv);
        li.appendChild(removeBtn);
        elements.selectedFilesList.appendChild(li);
        totalSize += item.file.size;
      });
      if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
        elements.confirmAttachBtn.disabled = true;
      } else {
        elements.confirmAttachBtn.disabled = false;
      }
    },
    // モデル選択に応じた警告メッセージの表示/非表示を切り替え
    updateModelWarningMessage() {
      const selectedModel = elements.modelNameSelect.value;
      const isNanoBanana = selectedModel === "gemini-2.5-flash-image-preview";
      elements.modelWarningMessage.classList.toggle("hidden", !isNanoBanana);
    },
    updateProfileSwitcher() {
      const switcher = elements.profileSwitcher;
      switcher.innerHTML = "";
      state.profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        if (profile.id === state.activeProfileId) {
          option.selected = true;
        }
        switcher.appendChild(option);
      });
      console.log("[UI] プロファイルスイッチャーを更新しました。");
    },
    updateProfileSwitcherUI() {
      const menus = [elements.headerProfileMenu, elements.headerProfileMenuSettings];
      menus.forEach((menu) => {
        if (!menu) return;
        menu.innerHTML = "";
        menu.addEventListener("click", (e) => e.stopPropagation());
      });
      state.profiles.forEach((profile) => {
        const menuItem = document.createElement("div");
        menuItem.classList.add("profile-menu-item");
        if (profile.id === state.activeProfileId) {
          menuItem.classList.add("active");
        }
        menuItem.dataset.profileId = profile.id;
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("profile-icon-container");
        if (profile.icon) {
          let url = state.profileIconUrls.get(profile.id);
          if (!url) {
            url = URL.createObjectURL(profile.icon);
            state.profileIconUrls.set(profile.id, url);
          }
          iconContainer.innerHTML = `<img src="${url}" alt="${htmlUtils.escapeAttr(profile.name)}">`;
        } else {
          iconContainer.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
        }
        const textContainer = document.createElement("div");
        textContainer.classList.add("profile-menu-text-container");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("profile-menu-name");
        nameSpan.textContent = profile.name;
        textContainer.appendChild(nameSpan);
        const modelLineDiv = document.createElement("div");
        modelLineDiv.classList.add("profile-menu-model-line");
        const modelSpan = document.createElement("span");
        modelSpan.classList.add("profile-menu-model");
        modelSpan.textContent = profile.settings?.modelName || "モデル未設定";
        modelLineDiv.appendChild(modelSpan);
        if (profile.settings?.modelName === "gemini-2.5-pro") {
          const usage = profile.apiUsage || { count: 0 };
          const countSpan = document.createElement("span");
          countSpan.classList.add("profile-menu-api-count");
          countSpan.textContent = `(本日: ${usage.count} 回)`;
          modelLineDiv.appendChild(countSpan);
        }
        textContainer.appendChild(modelLineDiv);
        menuItem.appendChild(iconContainer);
        menuItem.appendChild(textContainer);
        const switchHandler = /* @__PURE__ */ __name((event) => {
          event.stopPropagation();
          appLogic.switchProfile(profile.id);
          menus.forEach((m) => m?.classList.add("hidden"));
        }, "switchHandler");
        menus.forEach((menu) => {
          if (menu) {
            const clonedItem = menuItem.cloneNode(true);
            clonedItem.onclick = switchHandler;
            menu.appendChild(clonedItem);
          }
        });
      });
      console.log("[UI] プロファイルメニューを更新しました。");
    },
    updateProfileCardUI() {
      if (!state.activeProfile) return;
      const profile = state.activeProfile;
      const cards = [
        { name: elements.profileCardName, container: elements.profileCardIconContainer },
        { name: elements.profileCardNameSettings, container: elements.profileCardIconContainerSettings }
      ];
      cards.forEach((card) => {
        if (card.container) {
          if (profile.icon) {
            let url = state.profileIconUrls.get(profile.id);
            if (!url) {
              url = URL.createObjectURL(profile.icon);
              state.profileIconUrls.set(profile.id, url);
            }
            card.container.innerHTML = `<img src="${url}" alt="プロファイルアイコン">`;
          } else {
            card.container.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
          }
        }
        if (card.name) {
          card.name.textContent = profile.name;
        }
      });
      const iconImg = elements.profileDisplayIcon;
      const iconPlaceholder = iconImg.nextElementSibling;
      if (profile.icon) {
        let url = state.profileIconUrls.get(profile.id);
        if (!url) {
          url = URL.createObjectURL(profile.icon);
          state.profileIconUrls.set(profile.id, url);
        }
        iconImg.src = url;
        iconImg.style.display = "block";
        iconPlaceholder.style.display = "none";
        elements.profileResetIconBtn.style.display = "flex";
      } else {
        iconImg.style.display = "none";
        iconPlaceholder.style.display = "flex";
        elements.profileResetIconBtn.style.display = "none";
      }
      elements.profileDisplayNameMain.textContent = profile.name;
      const subText = `${profile.settings.modelName || "..."} / T: ${profile.settings.temperature ?? "..."}`;
      elements.profileDisplayNameSub.textContent = subText;
      elements.profileDisplayStatus.classList.toggle("active", profile.id === state.activeProfileId);
      console.log("[UI] プロファイルカードUIを更新しました。");
    },
    toggleProfileMenu(type) {
      console.log(`[Debug Toggle] toggleProfileMenuが呼び出されました。type: ${type}`);
      const menu = type === "header" ? elements.headerProfileMenu : elements.headerProfileMenuSettings;
      console.log("[Debug Toggle] 対象メニュー要素:", menu);
      if (menu) {
        menu.classList.toggle("hidden");
        console.log(`[Debug Toggle] hiddenクラスをトグルしました。現在のクラス: ${menu.className}`);
      } else {
        console.error("[Debug Toggle] エラー: 対象となるメニュー要素が見つかりません。");
      }
    },
    // --- 進捗ダイアログ ヘルパー ---
    showProgressDialog(message) {
      elements.progressMessage.textContent = message;
      if (!elements.progressDialog.open) {
        elements.progressDialog.showModal();
      }
    },
    updateProgressMessage(message) {
      elements.progressMessage.textContent = message;
    },
    hideProgressDialog() {
      if (elements.progressDialog.open) {
        elements.progressDialog.close();
      }
    },
    showSyncNotification(message, isError = false) {
      const notification = document.getElementById("sync-notification");
      const icon = document.getElementById("sync-notification-icon");
      const messageEl = document.getElementById("sync-notification-message");
      if (!notification || !icon || !messageEl) return;
      messageEl.textContent = message;
      notification.classList.remove("success", "error");
      if (isError) {
        notification.classList.add("error");
        icon.textContent = "cloud_off";
      } else {
        notification.classList.add("success");
        icon.textContent = "check_circle";
      }
      notification.classList.remove("hidden");
      notification.style.opacity = 1;
      setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
          notification.classList.add("hidden");
        }, 500);
      }, 4e3);
    }
  };

  // src/app-logic/profile.js
  var profileMethods = {
    async loadGlobalSettings() {
      try {
        console.log("[GlobalSettings] 共通設定の読み込みを開始します。");
        const storedBlob = await dbUtils.getSetting("backgroundImageBlob");
        if (storedBlob && storedBlob.value instanceof Blob) {
          state.settings.backgroundImageBlob = storedBlob.value;
          console.log("[GlobalSettings] 背景画像BlobをDBから読み込みました。");
        }
        const storedFetchedModels = await dbUtils.getSetting("fetchedModels");
        if (storedFetchedModels && storedFetchedModels.value) {
          state.settings.fetchedModels = storedFetchedModels.value;
          console.log("[GlobalSettings] API取得モデルをDBから読み込みました。");
        }
      } catch (error) {
        console.error("[GlobalSettings] 共通設定の読み込み中にエラーが発生しました:", error);
      }
    },
    async loadProfiles() {
      try {
        console.log("[Profile] プロファイルの読み込みを開始します。");
        state.profiles = await dbUtils.getAllProfiles();
        const activeIdSetting = await dbUtils.getSetting("activeProfileId");
        state.activeProfileId = activeIdSetting ? activeIdSetting.value : null;
        if (state.profiles.length === 0) {
          console.warn("[Profile] プロファイルが見つかりません。最初のプロファイルを作成します。");
          const newProfile = {
            name: "デフォルトプロファイル",
            icon: null,
            createdAt: Date.now(),
            settings: { ...state.settings }
          };
          const newId = await dbUtils.addProfile(newProfile);
          await dbUtils.saveSetting("activeProfileId", newId);
          state.profiles = [await dbUtils.getProfile(newId)];
          state.activeProfileId = newId;
        }
        if (!state.activeProfileId || !state.profiles.some((p) => p.id === state.activeProfileId)) {
          state.activeProfileId = state.profiles[0].id;
          await dbUtils.saveSetting("activeProfileId", state.activeProfileId);
          console.log(`[Profile] アクティブなプロファイルが無効でした。最初のプロファイル (ID: ${state.activeProfileId}) をアクティブに設定しました。`);
        }
        console.log(`[Profile] ${state.profiles.length}件のプロファイルを読み込みました。アクティブID: ${state.activeProfileId}`);
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
      } catch (error) {
        console.error("[Profile] プロファイルの読み込み中に致命的なエラーが発生しました:", error);
        await uiUtils.showCustomAlert(`プロファイルの読み込みに失敗しました: ${error}`);
      }
    },
    applyActiveProfile() {
      state.activeProfile = state.profiles.find((p) => p.id === state.activeProfileId);
      if (state.activeProfile) {
        console.log(`[Profile] プロファイル「${state.activeProfile.name}」(ID: ${state.activeProfile.id}) を適用します。`);
        const newSettings = { ...window.state.settings };
        const globalFetchedModels = newSettings.fetchedModels;
        const loadedProfileSettings = state.activeProfile.settings || {};
        Object.assign(newSettings, loadedProfileSettings);
        newSettings.fetchedModels = globalFetchedModels;
        state.settings = newSettings;
        uiUtils.applySettingsToUI();
        uiUtils.updateProfileCardUI();
        DebugLogger.init();
      } else {
        console.error(`[Profile] 適用すべきアクティブなプロファイル (ID: ${state.activeProfileId}) が見つかりません。`);
      }
    },
    async switchProfile(newProfileId) {
      newProfileId = Number(newProfileId);
      if (newProfileId === state.activeProfileId) return;
      console.log(`[Profile] プロファイルを ID: ${newProfileId} に切り替えます。`);
      await dbUtils.saveSetting("activeProfileId", newProfileId);
      state.activeProfileId = newProfileId;
      this.applyActiveProfile();
      uiUtils.updateProfileSwitcherUI();
    },
    async saveNewProfile() {
      if (state.profiles.length >= MAX_PROFILES) {
        return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、新しいプロファイルを作成できません。`);
      }
      const profileName = await uiUtils.showCustomPrompt("新しいプロファイル名を入力してください:", "新規プロファイル");
      if (!profileName || !profileName.trim()) {
        console.log("[Profile] 新規保存をキャンセルしました。");
        return;
      }
      const currentSettings = this.getCurrentUiSettings();
      const newProfile = {
        name: profileName.trim(),
        icon: state.activeProfile?.icon || null,
        createdAt: Date.now(),
        settings: currentSettings
      };
      try {
        const newId = await dbUtils.addProfile(newProfile);
        const newlyAddedProfile = await dbUtils.getProfile(newId);
        state.profiles.push(newlyAddedProfile);
        await dbUtils.saveSetting("activeProfileId", newId);
        state.activeProfileId = newId;
        this.markAsDirtyAndSchedulePush(true);
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
        await uiUtils.showCustomAlert(`プロファイル「${newProfile.name}」を保存しました。`);
      } catch (error) {
        console.error("[Profile] 新規プロファイルの保存に失敗しました:", error);
        await uiUtils.showCustomAlert(`プロファイルの保存に失敗しました: ${error}`);
      }
    },
    async updateCurrentProfile() {
      if (!state.activeProfile) {
        await uiUtils.showCustomAlert("更新対象のプロファイルが選択されていません。");
        return;
      }
      const updatedProfile = { ...state.activeProfile };
      try {
        await dbUtils.updateProfile(updatedProfile);
        const index = state.profiles.findIndex((p) => p.id === updatedProfile.id);
        if (index !== -1) {
          state.profiles[index] = updatedProfile;
        }
        this.markAsDirtyAndSchedulePush(true);
        console.log(`[Profile] プロファイル「${updatedProfile.name}」を更新しました。`);
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
      } catch (error) {
        console.error("[Profile] プロファイルの更新に失敗しました:", error);
        await uiUtils.showCustomAlert(`プロファイルの更新に失敗しました: ${error.message}`);
      }
    },
    async deleteCurrentProfile() {
      if (!state.activeProfile) return;
      if (state.profiles.length <= 1) {
        await uiUtils.showCustomAlert("最後のプロファイルは削除できません。");
        return;
      }
      const confirmed = await uiUtils.showCustomConfirm(`本当にプロファイル「${state.activeProfile.name}」を削除しますか？`);
      if (!confirmed) return;
      try {
        const idToDelete = state.activeProfileId;
        await dbUtils.deleteProfile(idToDelete);
        this.markAsDirtyAndSchedulePush(true);
        state.profiles = state.profiles.filter((p) => p.id !== idToDelete);
        if (state.profileIconUrls.has(idToDelete)) {
          URL.revokeObjectURL(state.profileIconUrls.get(idToDelete));
          state.profileIconUrls.delete(idToDelete);
        }
        const newActiveId = state.profiles[0].id;
        await dbUtils.saveSetting("activeProfileId", newActiveId);
        state.activeProfileId = newActiveId;
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
        await uiUtils.showCustomAlert("プロファイルを削除しました。");
      } catch (error) {
        console.error("[Profile] プロファイルの削除に失敗しました:", error);
        await uiUtils.showCustomAlert(`プロファイルの削除に失敗しました: ${error}`);
      }
    },
    async editCurrentProfileName() {
      if (!state.activeProfile) return;
      const newName = await uiUtils.showCustomPrompt("新しいプロファイル名:", state.activeProfile.name);
      if (newName && newName.trim() && newName.trim() !== state.activeProfile.name) {
        state.activeProfile.name = newName.trim();
        await this.updateCurrentProfile();
      }
    },
    handleProfileIconChange(file) {
      if (!file || !file.type.startsWith("image/")) return;
      if (state.activeProfile && state.profileIconUrls.has(state.activeProfile.id)) {
        const oldUrl = state.profileIconUrls.get(state.activeProfile.id);
        URL.revokeObjectURL(oldUrl);
        state.profileIconUrls.delete(state.activeProfile.id);
        console.log(`[Profile] 古いアイコンキャッシュを破棄しました (ID: ${state.activeProfile.id})`);
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const blob = new Blob([e.target.result], { type: file.type });
        if (state.activeProfile) {
          state.activeProfile.icon = blob;
          await this.updateCurrentProfile();
        }
      };
      reader.readAsArrayBuffer(file);
    },
    async resetProfileIcon() {
      if (!state.activeProfile) return;
      const confirmed = await uiUtils.showCustomConfirm("アイコンをデフォルトに戻しますか？");
      if (confirmed) {
        state.activeProfile.icon = null;
        if (state.profileIconUrls.has(state.activeProfile.id)) {
          URL.revokeObjectURL(state.profileIconUrls.get(state.activeProfile.id));
          state.profileIconUrls.delete(state.activeProfile.id);
        }
        await this.updateCurrentProfile();
      }
    },
    getCurrentUiSettings() {
      const settings = {};
      const stringKeys = ["apiProvider", "apiKey", "zaiApiKey", "openrouterApiKey", "bedrockAccessKey", "bedrockSecretKey", "bedrockRegion", "openaiApiKey", "anthropicApiKey", "anthropicCacheTTL", "anthropicEffort", "novelaiApiKey", "novelaiModel", "groqApiKey", "deepseekApiKey", "xaiApiKey", "mistralApiKey", "sakanaApiKey", "modelName", "dummyUser", "dummyModel", "additionalModels", "historySortOrder", "fontFamily", "proofreadingModelName", "proofreadingSystemInstruction", "googleSearchApiKey", "googleSearchEngineId", "headerColor", "thoughtTranslationModel", "summaryModelName", "summarySystemPrompt"];
      const numberKeys = ["temperature", "maxTokens", "topK", "topP", "thinkingBudget", "maxRetries", "maxBackoffDelaySeconds", "overlayOpacity", "messageOpacity"];
      const booleanKeys = ["enterToSend", "darkMode", "geminiEnableGrounding", "geminiEnableFunctionCalling", "enableSwipeNavigation", "enableProofreading", "enableAutoRetry", "useFixedRetryDelay", "reverseDummyOrder", "concatDummyModel", "dummyEnabled", "includeThoughts", "enableThoughtTranslation", "applyDummyToProofread", "applyDummyToTranslate", "forceFunctionCalling", "autoScroll", "enableWideMode", "enableSummaryButton"];
      settings.systemPrompt = elements.systemPromptDefaultTextarea.value.trim();
      settings.fixedRetryDelaySeconds = parseFloat(elements.fixedRetryDelayInput.value) || null;
      settings.hideSystemPromptInChat = elements.hideSystemPromptToggle.checked;
      settings.floatingPanelBehavior = elements.floatingPanelBehaviorSelect.value;
      const allowUiChangesEl = document.getElementById("allow-prompt-ui-changes");
      if (allowUiChangesEl) {
        settings.allowPromptUiChanges = allowUiChangesEl.checked;
      }
      stringKeys.forEach((key) => {
        if (key === "modelName") {
          const provider = settings.apiProvider || state.settings.apiProvider || "gemini";
          if (provider === "openrouter" && elements.openrouterModelInput) {
            settings[key] = elements.openrouterModelInput.value.trim();
          } else if (elements.modelNameSelect) {
            settings[key] = elements.modelNameSelect.value.trim();
          }
        } else {
          const element = elements[key + "Input"] || elements[key + "Select"] || elements[key + "Textarea"];
          if (element) settings[key] = element.value.trim();
        }
      });
      numberKeys.forEach((key) => {
        let element;
        if (key === "overlayOpacity" || key === "messageOpacity") {
          element = elements[key + "Slider"];
        } else {
          element = elements[key + "Input"];
        }
        if (element) {
          const value = key === "overlayOpacity" || key === "messageOpacity" ? parseFloat(element.value) / 100 : parseFloat(element.value);
          settings[key] = isNaN(value) ? null : value;
        }
      });
      booleanKeys.forEach((key) => {
        const element = elements[key + "Checkbox"] || elements[key + "Toggle"];
        if (element) settings[key] = element.checked;
      });
      console.log("[Profile] 現在のUIから設定を取得しました:", settings);
      return settings;
    },
    async exportProfile() {
      if (!state.activeProfile) {
        return uiUtils.showCustomAlert("エクスポートするプロファイルが選択されていません。");
      }
      const profileToExport = JSON.parse(JSON.stringify(state.activeProfile));
      if (state.activeProfile.icon instanceof Blob) {
        try {
          const base64Icon = await this.fileToBase64(state.activeProfile.icon);
          profileToExport.icon = {
            mimeType: state.activeProfile.icon.type,
            data: base64Icon
          };
        } catch (error) {
          console.error("アイコンのBase64変換に失敗:", error);
          return uiUtils.showCustomAlert("アイコンのエクスポート処理に失敗しました。");
        }
      }
      delete profileToExport.id;
      const jsonString = JSON.stringify(profileToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = profileToExport.name.replace(/[\\/:*?"<>|]/g, "_");
      a.href = url;
      a.download = `${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    async importProfile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (state.profiles.length >= MAX_PROFILES) {
            return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、プロファイルをインポートできません。`);
          }
          const importedData = JSON.parse(event.target.result);
          if (!importedData.name || !importedData.settings) {
            throw new Error("無効なファイルです。'name'と'settings'プロパティが必要です。");
          }
          let newProfile = { ...importedData };
          if (newProfile.icon && newProfile.icon.data) {
            try {
              newProfile.icon = await this.base64ToBlob(newProfile.icon.data, newProfile.icon.mimeType);
            } catch (error) {
              console.error("インポート時のアイコン復元に失敗:", error);
              newProfile.icon = null;
            }
          }
          let finalName = newProfile.name;
          const existingNames = state.profiles.map((p) => p.name);
          while (existingNames.includes(finalName)) {
            finalName = `${IMPORT_PREFIX}${finalName}`;
          }
          newProfile.name = finalName;
          const newId = await dbUtils.addProfile(newProfile);
          const newlyAddedProfile = await dbUtils.getProfile(newId);
          state.profiles.push(newlyAddedProfile);
          await dbUtils.saveSetting("activeProfileId", newId);
          state.activeProfileId = newId;
          this.markAsDirtyAndSchedulePush(true);
          this.applyActiveProfile();
          uiUtils.updateProfileSwitcherUI();
          await uiUtils.showCustomAlert(`プロファイル「${finalName}」をインポートしました。`);
        } catch (error) {
          console.error("プロファイルのインポートに失敗:", error);
          await uiUtils.showCustomAlert(`プロファイルのインポートに失敗しました: ${error.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // src/app-logic/lifecycle.js
  var lifecycleMethods = {
    _setupEventListenersCallCount: 0,
    timerManager: {
      timers: {},
      // { timer_name: { timerId: 123, endTime: 167... } }
      start(name, minutes) {
        if (this.timers[name]) {
          clearTimeout(this.timers[name].timerId);
          console.log(`タイマー「${name}」は上書きされました。`);
        }
        const durationMs = minutes * 60 * 1e3;
        const endTime = Date.now() + durationMs;
        const timerId = setTimeout(() => {
          console.log(`タイマー「${name}」が時間切れになりました。自動応答をトリガーします。`);
          delete this.timers[name];
          appLogic.triggerTimerExpiredResponse(name);
        }, durationMs);
        this.timers[name] = { timerId, endTime };
        const message = `タイマー「${name}」を${minutes}分で開始しました。`;
        console.log(`[Timer] ${message}`);
        return { success: true, message };
      },
      check(name) {
        if (!this.timers[name]) {
          return { success: false, message: `タイマー「${name}」はセットされていません。` };
        }
        const remainingMs = this.timers[name].endTime - Date.now();
        if (remainingMs <= 0) {
          return { success: true, status: "expired", message: `タイマー「${name}」は既に時間切れです。` };
        }
        const remainingMinutes = Math.floor(remainingMs / 6e4);
        const remainingSeconds = Math.floor(remainingMs % 6e4 / 1e3);
        const message = `タイマー「${name}」の残り時間は約${remainingMinutes}分${remainingSeconds}秒です。`;
        console.log(`[Timer] ${message}`);
        return { success: true, status: "running", remaining_time: message };
      },
      stop(name) {
        if (!this.timers[name]) {
          return { success: false, message: `タイマー「${name}」はセットされていません。` };
        }
        clearTimeout(this.timers[name].timerId);
        delete this.timers[name];
        const message = `タイマー「${name}」を停止しました。`;
        console.log(`[Timer] ${message}`);
        return { success: true, message };
      }
    },
    /**
    * タイマー時間切れ時にAIに応答を促す関数
    * @param {string} timerName - 時間切れになったタイマーの名前
    */
    async triggerTimerExpiredResponse(timerName) {
      if (state.isSending) {
        console.warn("タイマーが切れましたが、現在送信中のため自動応答をスキップします。");
        return;
      }
      console.log(`タイマー「${timerName}」の時間切れ応答を生成します。`);
      const systemInstructionForTimer = `[システムメモ]
タイマー「${timerName}」が時間切れになりました。
この事実を踏まえて、現在の会話の文脈に沿った自然な応答を生成してください。
例えば、「そういえば、約束の時間だね」「時間切れだ！イベントが発生する」のように、会話を続けてください。
このシステムメモ自体は応答に含めないでください。`;
      const userMessage = {
        role: "user",
        content: systemInstructionForTimer,
        timestamp: Date.now(),
        attachments: [],
        isHidden: true,
        isAutoTrigger: true
      };
      state.currentMessages.push(userMessage);
      const messageIndex = state.currentMessages.length - 1;
      uiUtils.appendMessage(userMessage.role, userMessage.content, messageIndex);
      const messageElement = elements.messageContainer.querySelector(`.message[data-index="${messageIndex}"]`);
      if (messageElement) {
        messageElement.style.display = "none";
      }
      await this.handleSend(false, -1, true);
    },
    applyWideMode() {
      document.body.classList.toggle("wide-mode-enabled", state.settings.enableWideMode);
      updateMessageMaxWidthVar();
    },
    getVisibleMessages() {
      const visibleMessages = [];
      const processedGroupIds = /* @__PURE__ */ new Set();
      state.currentMessages.forEach((msg) => {
        if (msg.isHidden) return;
        if (msg.isCascaded && msg.siblingGroupId) {
          if (!processedGroupIds.has(msg.siblingGroupId)) {
            const siblings = state.currentMessages.filter((m) => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
            const selectedSibling = siblings.find((m) => m.isSelected) || siblings[siblings.length - 1];
            if (selectedSibling) {
              visibleMessages.push(selectedSibling);
            }
            processedGroupIds.add(msg.siblingGroupId);
          }
        } else {
          visibleMessages.push(msg);
        }
      });
      return visibleMessages;
    },
    _updateApiUsageCount: /* @__PURE__ */ __name(async function(profileId) {
      if (!profileId) return;
      const profileToUpdate = state.profiles.find((p) => p.id === profileId);
      if (!profileToUpdate) return;
      const now = /* @__PURE__ */ new Date();
      const getPacificDate = /* @__PURE__ */ __name((date) => {
        const options = { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-CA", options);
        return formatter.format(date);
      }, "getPacificDate");
      const todayPacific = getPacificDate(now);
      if (!profileToUpdate.apiUsage || profileToUpdate.apiUsage.date !== todayPacific) {
        profileToUpdate.apiUsage = { date: todayPacific, count: 0 };
      }
      profileToUpdate.apiUsage.count++;
      try {
        await dbUtils.updateProfile(profileToUpdate);
        console.log(`[API Count] Profile ${profileId} の使用回数を更新しました。 Count for ${todayPacific}: ${profileToUpdate.apiUsage.count}`);
        this.updateApiUsageUI();
        uiUtils.updateProfileSwitcherUI();
      } catch (error) {
        console.error(`[API Count] プロファイルID ${profileId} の使用回数保存に失敗:`, error);
      }
    }, "_updateApiUsageCount"),
    _checkAndResetApiUsage: /* @__PURE__ */ __name(async function() {
      console.log("[API Count] 全プロファイルのAPI使用回数リセットチェックを開始します...");
      const now = /* @__PURE__ */ new Date();
      const getPacificDate = /* @__PURE__ */ __name((date) => {
        const options = { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-CA", options);
        return formatter.format(date);
      }, "getPacificDate");
      const todayPacific = getPacificDate(now);
      let profilesWereUpdated = false;
      for (const profile of state.profiles) {
        if (profile.apiUsage && profile.apiUsage.date !== todayPacific) {
          console.log(`[API Count] プロファイル「${profile.name}」(ID: ${profile.id}) の日付が古いため (${profile.apiUsage.date})、使用回数をリセットします。`);
          delete profile.apiUsage;
          try {
            await dbUtils.updateProfile(profile);
            profilesWereUpdated = true;
          } catch (error) {
            console.error(`[API Count] プロファイルID ${profile.id} のリセット保存に失敗:`, error);
          }
        }
      }
      if (profilesWereUpdated) {
        console.log("[API Count] 1つ以上のプロファイルが更新されたため、UIを再描画します。");
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
      } else {
        console.log("[API Count] リセットが必要なプロファイルはありませんでした。");
      }
    }, "_checkAndResetApiUsage"),
    updateApiUsageUI: /* @__PURE__ */ __name(function() {
      const profile = state.activeProfile;
      const usageContainer = document.getElementById("api-usage-container");
      const usageText = document.getElementById("api-usage-text");
      if (!usageContainer || !usageText || !profile) {
        if (usageContainer) usageContainer.classList.add("hidden");
        return;
      }
      const usage = profile.apiUsage || { count: 0 };
      if (state.settings.modelName === "gemini-2.5-pro" && state.settings.apiProvider === "gemini") {
        usageText.textContent = `gemini-2.5-pro 本日の使用回数: ${usage.count} 回 (日本時間16/17時リセット)`;
        usageContainer.classList.remove("hidden");
      } else {
        usageContainer.classList.add("hidden");
      }
    }, "updateApiUsageUI"),
    // プロバイダー変更時のUI更新
    updateProviderUI(provider) {
      const isGemini = provider === "gemini";
      const isZai = provider === "zai";
      const isOpenRouter = provider === "openrouter";
      const isBedrock = provider === "bedrock";
      const isOpenAI = provider === "openai";
      const isAnthropic = provider === "anthropic";
      const isGroq = provider === "groq";
      const isDeepSeek = provider === "deepseek";
      const isXAI = provider === "xai";
      const isMistral = provider === "mistral";
      const isSakana = provider === "sakana";
      const containers = [
        [elements.geminiApiKeyContainer, isGemini],
        [elements.zaiApiKeyContainer, isZai],
        [elements.openrouterApiKeyContainer, isOpenRouter],
        [elements.bedrockApiKeyContainer, isBedrock],
        [elements.openaiApiKeyContainer, isOpenAI],
        [elements.anthropicApiKeyContainer, isAnthropic],
        [elements.groqApiKeyContainer, isGroq],
        [elements.deepseekApiKeyContainer, isDeepSeek],
        [elements.xaiApiKeyContainer, isXAI],
        [elements.mistralApiKeyContainer, isMistral],
        [elements.sakanaApiKeyContainer, isSakana]
      ];
      containers.forEach(([el, show]) => {
        if (el) el.classList.toggle("hidden", !show);
      });
      if (elements.modelNameLabel) {
        elements.modelNameLabel.classList.toggle("hidden", isOpenRouter);
      }
      if (elements.modelNameSelect) {
        elements.modelNameSelect.classList.toggle("hidden", isOpenRouter);
      }
      if (elements.openrouterModelInputContainer) {
        elements.openrouterModelInputContainer.classList.toggle("hidden", !isOpenRouter);
      }
    },
    // プロバイダーに応じたモデルリストの更新
    updateModelOptions(provider) {
      if (provider === "openrouter") {
        if (elements.openrouterModelInput) {
          const currentModel = state.settings.modelName || DEFAULT_OPENROUTER_MODEL;
          elements.openrouterModelInput.value = currentModel;
        }
        uiUtils.updateModelWarningMessage();
        this.updateApiUsageUI();
        return;
      }
      const modelSelect = elements.modelNameSelect;
      if (!modelSelect) return;
      const userDefinedGroup = elements.userDefinedModelsGroup;
      const currentValue = modelSelect.value;
      const optgroups = Array.from(modelSelect.querySelectorAll("optgroup"));
      optgroups.forEach((group) => {
        if (group.id !== "user-defined-models-group") {
          group.remove();
        }
      });
      const options = Array.from(modelSelect.querySelectorAll("option:not([data-user-defined])"));
      options.forEach((option) => option.remove());
      let models;
      if (provider === "zai") {
        models = ZAI_MODELS;
      } else if (provider === "bedrock") {
        models = BEDROCK_MODELS;
      } else if (provider === "openai") {
        models = OPENAI_MODELS;
      } else if (provider === "anthropic") {
        models = ANTHROPIC_MODELS;
      } else if (provider === "groq") {
        models = GROQ_MODELS;
      } else if (provider === "deepseek") {
        models = DEEPSEEK_MODELS;
      } else if (provider === "xai") {
        models = XAI_MODELS;
      } else if (provider === "mistral") {
        models = MISTRAL_MODELS;
      } else if (provider === "sakana") {
        models = SAKANA_MODELS;
      } else {
        models = GEMINI_MODELS;
      }
      const groups = {};
      models.forEach((model) => {
        if (model.group) {
          if (!groups[model.group]) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = model.group;
            modelSelect.appendChild(optgroup);
            groups[model.group] = optgroup;
          }
          const option = document.createElement("option");
          option.value = model.value;
          option.textContent = model.label;
          groups[model.group].appendChild(option);
        } else {
          const option = document.createElement("option");
          option.value = model.value;
          option.textContent = model.label;
          modelSelect.appendChild(option);
        }
      });
      if (userDefinedGroup && userDefinedGroup.parentNode !== modelSelect) {
        modelSelect.appendChild(userDefinedGroup);
      }
      const standardValues = models.map((m) => m.value);
      if (userDefinedGroup) {
        userDefinedGroup.innerHTML = "";
        userDefinedGroup.disabled = false;
        const customText = state.settings && state.settings.customModelsText || {};
        const fetchedModels = state.settings && state.settings.fetchedModels || {};
        const manualIds = (customText[provider] || "").split(",").map((s) => s.trim()).filter(Boolean);
        manualIds.forEach((id) => {
          if (!standardValues.includes(id)) {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = id;
            opt.dataset.provider = provider;
            opt.dataset.userDefined = "true";
            userDefinedGroup.appendChild(opt);
          }
        });
        const allExisting = /* @__PURE__ */ new Set([...standardValues, ...manualIds]);
        const fetchedIds = (fetchedModels[provider] || []).filter((id) => !allExisting.has(id));
        if (fetchedIds.length > 0) {
          const fetchedGroup = document.createElement("optgroup");
          fetchedGroup.label = "API取得モデル";
          fetchedIds.forEach((id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = id;
            opt.dataset.provider = provider;
            fetchedGroup.appendChild(opt);
          });
          modelSelect.appendChild(fetchedGroup);
        }
      }
      const allAvailableValues = Array.from(modelSelect.querySelectorAll("option")).map((o) => o.value);
      if (allAvailableValues.includes(currentValue)) {
        modelSelect.value = currentValue;
      } else {
        const lastUsed = state.settings.lastModelPerProvider?.[provider];
        let defaultModel;
        if (lastUsed && allAvailableValues.includes(lastUsed)) {
          defaultModel = lastUsed;
        } else if (provider === "zai") {
          defaultModel = DEFAULT_ZAI_MODEL;
        } else if (provider === "openrouter") {
          defaultModel = DEFAULT_OPENROUTER_MODEL;
        } else if (provider === "bedrock") {
          defaultModel = DEFAULT_BEDROCK_MODEL;
        } else if (provider === "openai") {
          defaultModel = DEFAULT_OPENAI_MODEL;
        } else if (provider === "anthropic") {
          defaultModel = DEFAULT_ANTHROPIC_MODEL;
        } else if (provider === "groq") {
          defaultModel = DEFAULT_GROQ_MODEL;
        } else if (provider === "deepseek") {
          defaultModel = DEFAULT_DEEPSEEK_MODEL;
        } else if (provider === "xai") {
          defaultModel = DEFAULT_XAI_MODEL;
        } else if (provider === "mistral") {
          defaultModel = DEFAULT_MISTRAL_MODEL;
        } else if (provider === "sakana") {
          defaultModel = DEFAULT_SAKANA_MODEL;
        } else {
          defaultModel = DEFAULT_MODEL;
        }
        modelSelect.value = defaultModel;
        state.settings.modelName = defaultModel;
      }
      uiUtils.updateModelWarningMessage();
      this.updateApiUsageUI();
    },
    // アプリ初期化
    async initializeApp() {
      const isSyncReload = sessionStorage.getItem("isSyncReload") === "true";
      uiUtils.showProgressDialog(isSyncReload ? "データベースを準備中..." : "初期化処理を開始中...");
      setupBroadcastChannel();
      let versionNoticeData = null;
      try {
        const pendingNoticeRaw = sessionStorage.getItem(VERSION_NOTICE_SESSION_KEY);
        if (pendingNoticeRaw) {
          try {
            versionNoticeData = JSON.parse(pendingNoticeRaw);
            console.log(`[VersionNotice] ペンディング通知を検出しました。version=${versionNoticeData.version}`);
          } catch (parseError) {
            console.error("[VersionNotice] ペンディング通知の解析に失敗しました。削除して再生成します。", parseError);
            sessionStorage.removeItem(VERSION_NOTICE_SESSION_KEY);
            versionNoticeData = null;
          }
        }
        if (!versionNoticeData) {
          const acknowledgedVersion = localStorage.getItem(VERSION_ACK_STORAGE_KEY);
          const legacyVersion = localStorage.getItem(VERSION_LEGACY_STORAGE_KEY);
          const currentVersion = APP_VERSION;
          console.log(`[VersionNotice] バージョンチェック開始。ack=${acknowledgedVersion ?? "none"}, legacy=${legacyVersion ?? "none"}, current=${currentVersion}`);
          const shouldShowNotice = !acknowledgedVersion || acknowledgedVersion !== currentVersion || legacyVersion && legacyVersion !== currentVersion;
          if (shouldShowNotice) {
            const newFeatures = VERSION_HISTORY[currentVersion];
            let message = `アプリがバージョン ${currentVersion} にアップデートされました。`;
            if (newFeatures && newFeatures.length > 0) {
              message += "\n\n主な更新内容:\n- " + newFeatures.join("\n- ");
            }
            versionNoticeData = {
              version: currentVersion,
              message,
              shouldPersist: true
            };
            sessionStorage.setItem(VERSION_NOTICE_SESSION_KEY, JSON.stringify(versionNoticeData));
            console.log(`[VersionNotice] 新しいバージョン通知を作成しました。(ack=${acknowledgedVersion ?? "none"}, legacy=${legacyVersion ?? "none"})`);
          } else {
            console.log("[VersionNotice] 既に最新バージョンが確認済みのため通知をスキップします。");
          }
        }
      } catch (e) {
        console.error("バージョンチェック処理中にエラー:", e);
      }
      try {
        if (isSyncReload) uiUtils.updateProgressMessage("データベースを準備中...");
        await dbUtils.openDB();
      } catch (dbError) {
        console.error("初期化中のDBオープンに失敗:", dbError);
        const shouldReload = await uiUtils.showCustomConfirm(
          `データベースの起動に失敗しました: ${dbError.message}

ハードリロードを実行しますか？
（チャット履歴などのデータは保持されます）`
        );
        if (shouldReload) {
          console.log("ユーザーがリロードを選択しました。");
          window.location.reload(true);
        } else {
          elements.appContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">アプリの起動に失敗しました。</p>`;
        }
        return;
      }
      try {
        const cleanupFlag = await dbUtils.getSetting("imageStoreCleanup_v1_complete");
        if (!cleanupFlag || !cleanupFlag.value) {
          console.log("[Cleanup] 孤児画像データのクリーンアップ処理を開始します...");
          const allChats = await dbUtils.getAllChats();
          const activeImageIds = /* @__PURE__ */ new Set();
          allChats.forEach((chat) => {
            (chat.messages || []).forEach((message) => {
              (message.imageIds || []).forEach((id) => activeImageIds.add(id));
            });
          });
          console.log(`[Cleanup] ${activeImageIds.size}件の有効な画像IDを検出しました。`);
          const allStoredImageIds = await new Promise((resolve, reject) => {
            const store = dbUtils._getStore(IMAGE_STORE);
            const request = store.getAllKeys();
            request.onsuccess = () => resolve(new Set(request.result));
            request.onerror = (e) => reject(e.target.error);
          });
          console.log(`[Cleanup] image_storeには ${allStoredImageIds.size}件の画像が存在します。`);
          const orphanImageIds = [];
          allStoredImageIds.forEach((storedId) => {
            if (!activeImageIds.has(storedId)) {
              orphanImageIds.push(storedId);
            }
          });
          if (orphanImageIds.length > 0) {
            console.log(`[Cleanup] ${orphanImageIds.length}件の孤児画像を削除します。`, orphanImageIds);
            const tx = state.db.transaction(IMAGE_STORE, "readwrite");
            const store = tx.objectStore(IMAGE_STORE);
            orphanImageIds.forEach((id) => store.delete(id));
            await new Promise((resolve, reject) => {
              tx.oncomplete = resolve;
              tx.onerror = () => reject(tx.error);
            });
            console.log("[Cleanup] 孤児画像の削除が完了しました。");
          } else {
            console.log("[Cleanup] 孤児画像は見つかりませんでした。");
          }
          await dbUtils.saveSetting("imageStoreCleanup_v1_complete", true);
          console.log("[Cleanup] クリーンアップ処理が正常に完了しました。");
        } else {
          console.log("[Cleanup] 孤児画像データのクリーンアップは既に完了しています。");
        }
      } catch (error) {
        console.error("[Cleanup] 孤児画像データのクリーンアップ中にエラーが発生しました:", error);
      }
      const handleAuthCallback = /* @__PURE__ */ __name(async () => {
        console.log("[SYNC_DEBUG] handleAuthCallback: 開始");
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get("code");
        if (authCode) {
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          uiUtils.showProgressDialog("Dropboxと連携中...");
          try {
            const REDIRECT_URI = window.location.origin + window.location.pathname;
            const codeVerifier = sessionStorage.getItem("dropboxCodeVerifier");
            if (!codeVerifier) {
              throw new Error("認証セッションが見つかりません。もう一度お試しください。");
            }
            await window.dropboxApi.getAccessToken(authCode, REDIRECT_URI, codeVerifier);
            console.log("Dropbox連携に成功し、トークンを保存しました。");
            await this.updateDropboxUIState();
            console.log("[SYNC_DEBUG] handleAuthCallback: 初回連携のため、handlePull(true)を呼び出します。");
            await this.handlePull(true);
            console.log("[SYNC_DEBUG] handleAuthCallback: handlePullが完了しました。");
          } catch (error) {
            console.error("Dropboxのトークン取得に失敗:", error);
            uiUtils.hideProgressDialog();
            await uiUtils.showCustomAlert(`連携に失敗しました: ${error.message}`);
          } finally {
            sessionStorage.removeItem("dropboxCodeVerifier");
          }
        }
      }, "handleAuthCallback");
      await handleAuthCallback();
      if (typeof marked !== "undefined") {
        const renderer = new marked.Renderer();
        const escapeHtmlText = /* @__PURE__ */ __name((t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "escapeHtmlText");
        renderer.html = (token) => escapeHtmlText(typeof token === "object" && token !== null ? token.text : token);
        const originalLinkRenderer = renderer.link;
        renderer.link = (href, title, text) => {
          const rawHref = href && typeof href === "object" ? href.href : href;
          if (typeof rawHref === "string" && /^\s*(javascript|vbscript|data)\s*:/i.test(rawHref)) {
            const label = href && typeof href === "object" ? href.text : text;
            return escapeHtmlText(label || rawHref);
          }
          const html = originalLinkRenderer.call(renderer, href, title, text);
          return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
        };
        marked.setOptions({ renderer, breaks: true, gfm: true, smartypants: false });
      } else {
        console.error("Marked.jsライブラリが読み込まれていません！");
      }
      elements.appVersionSpan.textContent = APP_VERSION;
      window.addEventListener("beforeinstallprompt", (e) => e.preventDefault());
      window.debug = {
        getState: /* @__PURE__ */ __name(() => console.log(state), "getState"),
        getMemory: /* @__PURE__ */ __name(() => console.log(state.currentPersistentMemory), "getMemory"),
        getChat: /* @__PURE__ */ __name(async (id) => console.log(await dbUtils.getChat(id || state.currentChatId)), "getChat")
      };
      registerServiceWorker();
      this.imageObserver = new IntersectionObserver(async (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const img = entry.target;
            const imageId = img.dataset.imageId;
            observer.unobserve(img);
            const imageData = await this.getImageBlobById(imageId);
            if (imageData && imageData.blob) {
              if (imageData.width && imageData.height) {
                img.width = imageData.width;
                img.height = imageData.height;
              }
              const objectURL = URL.createObjectURL(imageData.blob);
              img.src = objectURL;
              img.alt = "生成された画像";
            } else {
              img.alt = "画像の読み込みに失敗しました";
              img.classList.add("load-error");
            }
          }
        }
      }, { rootMargin: "200px" });
      const mutationObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === "childList") {
            mutation.removedNodes.forEach((node) => {
              const imagesToRevoke = [];
              if (node.tagName === "IMG" && node.src.startsWith("blob:")) {
                imagesToRevoke.push(node);
              } else if (node.querySelectorAll) {
                node.querySelectorAll('img[src^="blob:"]').forEach((img) => imagesToRevoke.push(img));
              }
              imagesToRevoke.forEach((img) => {
                console.log(`[Memory] DOMから削除された画像のURLを解放します: ${img.src}`);
                URL.revokeObjectURL(img.src);
              });
            });
          }
        }
      });
      mutationObserver.observe(elements.messageContainer, { childList: true, subtree: true });
      try {
        if (isSyncReload) uiUtils.updateProgressMessage("各種設定を読み込み中...");
        await this.loadGlobalSettings();
        if (isSyncReload) uiUtils.updateProgressMessage("プロファイル情報を読み込み中...");
        await this.loadProfiles();
        await this._checkAndResetApiUsage();
        this.updateApiUsageUI();
        await this.initializeSyncState();
        await this.updateDropboxUIState();
        const tokenData = await dbUtils.getSetting("dropboxTokens");
        let recoveryFlowExecuted = false;
        if (tokenData && tokenData.value) {
          const lockData = await window.dropboxApi.checkLockFile();
          if (lockData && lockData.operation) {
            recoveryFlowExecuted = true;
            console.warn(`[Sync Recovery] 同期ロックファイルを検出。中断された操作: ${lockData.operation}`);
            this.updateSyncStatusUI("syncing", `中断された${lockData.operation === "push" ? "同期" : "復元"}を再開中...`);
            if (lockData.operation === "push") {
              state.sync.isDirty = true;
              await this.handlePush(false);
            } else if (lockData.operation === "pull") {
              await this.handlePull(false);
            }
          } else if (lockData) {
            recoveryFlowExecuted = true;
            console.warn("[Sync Recovery] 操作タイプ不明のロックファイルを検出。ユーザーに選択を促します。");
            const choice = await this.showRecoveryDialog();
            if (choice === "pull") {
              await this.handlePull(true);
            } else if (choice === "push") {
              state.sync.isDirty = true;
              await this.handlePush(true);
            } else {
              await window.dropboxApi.deleteLockFile();
            }
          }
        }
        if (!new URLSearchParams(window.location.search).has("code") && !recoveryFlowExecuted) {
          console.log("[SYNC_DEBUG] initializeApp: 通常起動のため、handlePull(false)を呼び出します。");
          await this.handlePull(false);
        } else {
          console.log("[SYNC_DEBUG] initializeApp: OAuthコールバックまたは復旧フローが実行されたため、通常のPullはスキップします。");
        }
        await this.updateDropboxUIState();
        const profiles = await dbUtils.getAllProfiles();
        if (profiles.length === 0) {
          const oldSettingsArray = await new Promise((resolve, reject) => {
            const store = dbUtils._getStore(SETTINGS_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result.filter((s) => s.key !== "dropboxTokens"));
            request.onerror = (e) => reject(e.target.error);
          });
          if (oldSettingsArray.length > 0) {
            console.log("[Migration] プロファイルが存在せず、古い設定データが見つかったため移行処理を実行します。");
            const oldSettingsObject = {};
            oldSettingsArray.forEach((item) => {
              oldSettingsObject[item.key] = item.value;
            });
            const initialProfileSettings = { ...state.settings, ...oldSettingsObject };
            delete initialProfileSettings.backgroundImageBlob;
            const defaultProfile = { name: "デフォルトプロファイル", icon: null, createdAt: Date.now(), settings: initialProfileSettings };
            const newId = await dbUtils.addProfile(defaultProfile);
            await new Promise((resolve, reject) => {
              const store = dbUtils._getStore(SETTINGS_STORE, "readwrite");
              store.clear().onsuccess = () => resolve();
              store.transaction.onerror = () => reject(store.transaction.error);
            });
            await dbUtils.saveSetting("activeProfileId", newId);
            console.log("[Migration] データ移行が完了しました。");
            await this.loadProfiles();
          }
        }
        if (isSyncReload) uiUtils.updateProgressMessage("チャット履歴を読み込み中...");
        const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
        if (chats && chats.length > 0) {
          await this.loadChat(chats[0].id);
        } else {
          this.startNewChat();
        }
      } catch (error) {
        console.error("初期化中のデータ処理で失敗:", error);
        const shouldReload = await uiUtils.showCustomConfirm(
          `データの読み込みに失敗しました: ${error.message}

ハードリロードを実行しますか？
（チャット履歴などのデータは保持されます）`
        );
        if (shouldReload) {
          console.log("ユーザーがリロードを選択しました。");
          window.location.reload(true);
          return;
        }
      } finally {
        if (isSyncReload) uiUtils.updateProgressMessage("画面を描画中...");
        elements.chatScreen.style.transform = "translateX(0)";
        elements.historyScreen.style.transform = "translateX(-100%)";
        elements.settingsScreen.style.transform = "translateX(100%)";
        uiUtils.showScreen("chat", true);
        history.replaceState({ screen: "chat" }, "", "#chat");
        state.currentScreen = "chat";
        updateMessageMaxWidthVar();
        this.setupEventListeners();
        this.updateZoomState();
        uiUtils.adjustTextareaHeight();
        uiUtils.setSendingState(false);
        this.updateAssetCount();
        this.toggleSummaryButtonVisibility();
        this.scrollToBottom();
        this.applyFloatingPanelBehavior();
        uiUtils.hideProgressDialog();
        sessionStorage.removeItem("isSyncReload");
        if (versionNoticeData && versionNoticeData.message) {
          try {
            console.log(`[VersionNotice] 通知を表示します。version=${versionNoticeData.version}`);
            await uiUtils.showCustomAlert(versionNoticeData.message);
            console.log("[VersionNotice] 通知がユーザーによって確認されました。");
            if (versionNoticeData.shouldPersist) {
              localStorage.setItem(VERSION_ACK_STORAGE_KEY, versionNoticeData.version);
              localStorage.setItem(VERSION_LEGACY_STORAGE_KEY, versionNoticeData.version);
              console.log(`[VersionNotice] バージョン ${versionNoticeData.version} をACK/LEGACYキーに保存しました。`);
            }
          } catch (versionAlertError) {
            console.error("[VersionNotice] 通知の表示に失敗しました:", versionAlertError);
          } finally {
            sessionStorage.removeItem(VERSION_NOTICE_SESSION_KEY);
          }
        }
      }
    },
    // イベントリスナーを設定
    setupEventListeners() {
      if (!this._popstateBound) {
        window.addEventListener("popstate", this.handlePopState.bind(this));
        this._popstateBound = true;
      }
      this._setupEventListenersCallCount++;
      elements.gotoHistoryBtn.addEventListener("click", () => uiUtils.showScreen("history"));
      elements.gotoSettingsBtn.addEventListener("click", () => uiUtils.showScreen("settings"));
      elements.backToChatFromHistoryBtn.addEventListener("click", () => uiUtils.showScreen("chat"));
      elements.backToChatFromSettingsBtn.addEventListener("click", () => uiUtils.showScreen("chat"));
      const restoreFromCloudBtn = document.getElementById("restore-from-cloud-btn");
      if (restoreFromCloudBtn && !restoreFromCloudBtn._bound) {
        restoreFromCloudBtn._bound = true;
        restoreFromCloudBtn.addEventListener("click", async () => {
          restoreFromCloudBtn.disabled = true;
          restoreFromCloudBtn.textContent = "復元中...";
          try {
            await this.forceRestoreFromCloud();
          } finally {
            restoreFromCloudBtn.disabled = false;
            restoreFromCloudBtn.textContent = "☁️ クラウドから復元";
          }
        });
      }
      elements.newChatBtn.addEventListener("click", () => this.confirmStartNewChat());
      elements.sendButton.addEventListener("click", () => {
        if (state.isSending) {
          this.abortRequest();
        } else {
          this.handleSend();
        }
      });
      elements.userInput.addEventListener("input", () => uiUtils.adjustTextareaHeight());
      elements.userInput.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") {
          e.preventDefault();
          if (!elements.sendButton.disabled) this.handleSend();
          return;
        }
        if (state.settings.enterToSend && e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          if (!elements.sendButton.disabled) this.handleSend();
        }
      });
      elements.systemPromptDetails.addEventListener("toggle", (event) => {
        if (event.target.open) {
          this.startEditSystemPrompt();
        } else if (state.isEditingSystemPrompt) {
          this.cancelEditSystemPrompt();
        }
      });
      elements.saveSystemPromptBtn.addEventListener("click", () => this.saveCurrentSystemPrompt());
      elements.cancelSystemPromptBtn.addEventListener("click", () => this.cancelEditSystemPrompt());
      elements.profileCardHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        uiUtils.toggleProfileMenu("header");
      });
      elements.profileCardHeaderSettings.addEventListener("click", (e) => {
        e.stopPropagation();
        uiUtils.toggleProfileMenu("settings");
      });
      document.addEventListener("click", (e) => {
        const target = e.target;
        const isHeaderCardClicked = elements.profileCardHeader.contains(target);
        const isSettingsCardClicked = elements.profileCardHeaderSettings.contains(target);
        const isHeaderMenuClicked = elements.headerProfileMenu.contains(target);
        const isSettingsMenuClicked = elements.headerProfileMenuSettings.contains(target);
        if (!isHeaderCardClicked && !isSettingsCardClicked && !isHeaderMenuClicked && !isSettingsMenuClicked) {
          elements.headerProfileMenu.classList.add("hidden");
          elements.headerProfileMenuSettings.classList.add("hidden");
        }
      });
      elements.profileEditNameBtn.addEventListener("click", () => this.editCurrentProfileName());
      elements.profileIconInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleProfileIconChange(file);
        }
        e.target.value = null;
      });
      elements.profileResetIconBtn.addEventListener("click", () => this.resetProfileIcon());
      elements.profileSaveNewBtn.addEventListener("click", () => this.saveNewProfile());
      elements.profileDeleteBtn.addEventListener("click", () => this.deleteCurrentProfile());
      elements.profileExportBtn.addEventListener("click", () => this.exportProfile());
      elements.profileImportBtn.addEventListener("click", () => elements.profileImportInput.click());
      elements.profileImportInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) this.importProfile(file);
        e.target.value = null;
      });
      document.getElementById("reset-api-count-btn").addEventListener("click", async () => {
        const confirmed = await uiUtils.showCustomConfirm("API使用回数のカウントを0にリセットしますか？");
        if (confirmed) {
          const profile = state.activeProfile;
          if (profile) {
            if (profile.apiUsage) {
              delete profile.apiUsage;
              try {
                await dbUtils.updateProfile(profile);
                this.markAsDirtyAndSchedulePush("structural");
                console.log(`[API Count] カウンターが手動でリセットされました (Profile ID: ${profile.id})`);
                this.updateApiUsageUI();
                uiUtils.updateProfileSwitcherUI();
              } catch (error) {
                console.error(`[API Count] カウンターリセットの保存に失敗:`, error);
              }
            }
          }
        }
      });
      document.getElementById("clear-sync-error-btn").addEventListener("click", () => {
        state.sync.lastError = null;
        dbUtils.saveSetting("syncLastError", null);
        const newStatus = state.sync.isDirty ? "dirty" : "idle";
        this.updateSyncStatusUI(newStatus);
      });
      const setupInstantSave = /* @__PURE__ */ __name((element, key, eventType = "change", onUpdate = null, getValue = null) => {
        if (element) {
          element.addEventListener(eventType, async () => {
            if (!state.activeProfile) return;
            let value;
            if (getValue) {
              value = getValue();
            } else {
              switch (element.type) {
                case "checkbox":
                  value = element.checked;
                  break;
                case "range":
                  value = parseFloat(element.value) / 100;
                  break;
                case "number":
                case "select-one": {
                  const rawValue = element.value;
                  value = parseFloat(rawValue);
                  if (isNaN(value)) {
                    value = rawValue === "" ? null : rawValue;
                  }
                  break;
                }
                default:
                  value = element.value;
                  break;
              }
            }
            state.settings[key] = value;
            state.activeProfile.settings[key] = value;
            await dbUtils.updateProfile(state.activeProfile);
            appLogic.markAsDirtyAndSchedulePush("structural");
            if (onUpdate) {
              onUpdate(value);
            }
          });
        } else {
          console.warn(`❌ [Debug Settings] '${key}' に対応するDOM要素が見つかりません。`);
        }
      }, "setupInstantSave");
      const settingsMap = {
        apiProvider: {
          element: elements.apiProviderSelect,
          event: "change",
          onUpdate: /* @__PURE__ */ __name((value) => {
            this.updateProviderUI(value);
            this.updateModelOptions(value);
          }, "onUpdate")
        },
        apiKey: { element: elements.apiKeyInput, event: "input" },
        zaiApiKey: { element: elements.zaiApiKeyInput, event: "input" },
        openrouterApiKey: { element: elements.openrouterApiKeyInput, event: "input" },
        bedrockAccessKey: { element: elements.bedrockAccessKeyInput, event: "input" },
        bedrockSecretKey: { element: elements.bedrockSecretKeyInput, event: "input" },
        bedrockRegion: { element: elements.bedrockRegionSelect, event: "change" },
        openaiApiKey: { element: elements.openaiApiKeyInput, event: "input" },
        anthropicApiKey: { element: elements.anthropicApiKeyInput, event: "input" },
        anthropicCacheTTL: { element: elements.anthropicCacheTTLSelect, event: "change", getValue: /* @__PURE__ */ __name(() => elements.anthropicCacheTTLSelect ? elements.anthropicCacheTTLSelect.value : "5m", "getValue") },
        anthropicEffort: { element: elements.anthropicEffortSelect, event: "change", getValue: /* @__PURE__ */ __name(() => elements.anthropicEffortSelect ? elements.anthropicEffortSelect.value : "high", "getValue") },
        novelaiApiKey: { element: elements.novelaiApiKeyInput, event: "input" },
        novelaiModel: { element: elements.novelaiModelSelect, event: "change", getValue: /* @__PURE__ */ __name(() => elements.novelaiModelSelect ? elements.novelaiModelSelect.value : "nai-diffusion-4-5-curated", "getValue") },
        groqApiKey: { element: elements.groqApiKeyInput, event: "input" },
        deepseekApiKey: { element: elements.deepseekApiKeyInput, event: "input" },
        xaiApiKey: { element: elements.xaiApiKeyInput, event: "input" },
        mistralApiKey: { element: elements.mistralApiKeyInput, event: "input" },
        sakanaApiKey: { element: elements.sakanaApiKeyInput, event: "input" },
        modelName: {
          element: elements.modelNameSelect,
          event: "change",
          onUpdate: /* @__PURE__ */ __name(() => {
            uiUtils.updateModelWarningMessage();
            this.updateApiUsageUI();
            const sel = elements.modelNameSelect;
            if (sel) {
              const opt = sel.options[sel.selectedIndex];
              if (opt && opt.dataset.provider && opt.dataset.provider !== state.settings.apiProvider) {
                const newProvider = opt.dataset.provider;
                state.settings.apiProvider = newProvider;
                if (elements.apiProviderSelect) {
                  elements.apiProviderSelect.value = newProvider;
                  elements.apiProviderSelect.dispatchEvent(new Event("change"));
                }
              }
            }
          }, "onUpdate"),
          getValue: /* @__PURE__ */ __name(() => {
            const provider = state.settings.apiProvider || "gemini";
            if (provider === "openrouter" && elements.openrouterModelInput) {
              return elements.openrouterModelInput.value.trim();
            }
            return elements.modelNameSelect ? elements.modelNameSelect.value.trim() : "";
          }, "getValue")
        },
        systemPrompt: { element: elements.systemPromptDefaultTextarea, event: "input" },
        temperature: { element: elements.temperatureInput, event: "input" },
        maxTokens: { element: elements.maxTokensInput, event: "input" },
        topK: { element: elements.topKInput, event: "input" },
        topP: { element: elements.topPInput, event: "input" },
        thinkingBudget: { element: elements.thinkingBudgetInput, event: "input" },
        includeThoughts: { element: elements.includeThoughtsToggle, event: "change" },
        enableThoughtTranslation: { element: elements.enableThoughtTranslationCheckbox, event: "change" },
        thoughtTranslationModel: { element: elements.thoughtTranslationModelSelect, event: "change" },
        dummyUser: { element: elements.dummyUserInput, event: "input" },
        dummyEnabled: { element: elements.dummyEnabledToggle, event: "change" },
        applyDummyToProofread: { element: elements.applyDummyToProofreadCheckbox, event: "change" },
        applyDummyToTranslate: { element: elements.applyDummyToTranslateCheckbox, event: "change" },
        dummyModel: { element: elements.dummyModelInput, event: "input" },
        reverseDummyOrder: { element: elements.reverseDummyOrderCheckbox, event: "change" },
        concatDummyModel: { element: elements.concatDummyModelCheckbox, event: "change" },
        additionalModels: { element: elements.additionalModelsTextarea, event: "input" },
        enterToSend: { element: elements.enterToSendCheckbox, event: "change" },
        historySortOrder: { element: elements.historySortOrderSelect, event: "change" },
        darkMode: { element: elements.darkModeToggle, event: "change", onUpdate: /* @__PURE__ */ __name(() => uiUtils.applyDarkMode(), "onUpdate") },
        debugMode: { element: elements.debugModeToggle, event: "change", onUpdate: /* @__PURE__ */ __name((value) => {
          DebugLogger.init();
          this.toggleDebugLogButtonVisibility(value);
        }, "onUpdate") },
        fontFamily: { element: elements.fontFamilyInput, event: "input", onUpdate: /* @__PURE__ */ __name(() => uiUtils.applyFontFamily(), "onUpdate") },
        hideSystemPromptInChat: { element: elements.hideSystemPromptToggle, event: "change", onUpdate: /* @__PURE__ */ __name(() => uiUtils.toggleSystemPromptVisibility(), "onUpdate") },
        geminiEnableGrounding: { element: elements.geminiEnableGroundingToggle, event: "change" },
        geminiEnableFunctionCalling: { element: elements.geminiEnableFunctionCallingToggle, event: "change" },
        enableSwipeNavigation: { element: elements.swipeNavigationToggle, event: "change" },
        enableProofreading: { element: elements.enableProofreadingCheckbox, event: "change" },
        proofreadingModelName: { element: elements.proofreadingModelNameSelect, event: "change" },
        proofreadingSystemInstruction: { element: elements.proofreadingSystemInstructionTextarea, event: "input" },
        enableAutoRetry: { element: elements.enableAutoRetryCheckbox, event: "change" },
        maxRetries: { element: elements.maxRetriesInput, event: "input" },
        useFixedRetryDelay: { element: elements.useFixedRetryDelayCheckbox, event: "change" },
        fixedRetryDelaySeconds: { element: elements.fixedRetryDelayInput, event: "input" },
        maxBackoffDelaySeconds: { element: elements.maxBackoffDelayInput, event: "input" },
        enableApiTimeout: { element: elements.enableApiTimeoutCheckbox, event: "change" },
        apiTimeoutSeconds: { element: elements.apiTimeoutSecondsInput, event: "input" },
        googleSearchApiKey: { element: elements.googleSearchApiKeyInput, event: "input" },
        googleSearchEngineId: { element: elements.googleSearchEngineIdInput, event: "input" },
        overlayOpacity: { element: elements.overlayOpacitySlider, event: "input", onUpdate: /* @__PURE__ */ __name(() => uiUtils.applyOverlayOpacity(), "onUpdate") },
        messageOpacity: { element: elements.messageOpacitySlider, event: "input", onUpdate: /* @__PURE__ */ __name((value) => document.documentElement.style.setProperty("--message-bubble-opacity", String(value)), "onUpdate") },
        headerColor: { element: elements.headerColorInput, event: "input", onUpdate: /* @__PURE__ */ __name(() => uiUtils.applyHeaderColor(), "onUpdate") },
        forceFunctionCalling: { element: elements.forceFunctionCallingToggle, event: "change" },
        autoScroll: { element: elements.autoScrollToggle, event: "change" },
        enableWideMode: { element: elements.enableWideModeToggle, event: "change", onUpdate: /* @__PURE__ */ __name(() => this.applyWideMode(), "onUpdate") },
        enableMemory: { element: elements.enableMemoryToggle, event: "change", onUpdate: /* @__PURE__ */ __name((value) => this.toggleMemoryOptions(value), "onUpdate") },
        memoryAutoSaveInterval: { element: elements.memoryAutoSaveIntervalSelect, event: "change" },
        headerAutoHide: { element: elements.headerAutoHideToggle, event: "change", onUpdate: /* @__PURE__ */ __name((value) => document.body.classList.toggle("header-auto-hide", value), "onUpdate") },
        dropboxSyncFrequency: { element: elements.dropboxSyncFrequencySelect, event: "change" },
        summaryModelName: { element: elements.summaryModelNameSelect, event: "change" },
        summarySystemPrompt: { element: elements.summarySystemPromptTextarea, event: "input" },
        enableSummaryButton: { element: elements.enableSummaryButtonToggle, event: "change", onUpdate: /* @__PURE__ */ __name(() => this.toggleSummaryButtonVisibility(), "onUpdate") },
        floatingPanelBehavior: { element: elements.floatingPanelBehaviorSelect, event: "change", onUpdate: /* @__PURE__ */ __name(() => this.applyFloatingPanelBehavior(), "onUpdate") },
        sdApiUrl: { element: elements.sdApiUrlInput, event: "input" },
        sdApiUser: { element: elements.sdApiUserInput, event: "input" },
        sdApiPassword: { element: elements.sdApiPasswordInput, event: "input" },
        sdEnableQualityChecker: {
          element: elements.sdEnableQualityCheckerCheckbox,
          event: "change",
          onUpdate: /* @__PURE__ */ __name((value) => {
            elements.sdQualityCheckerOptionsDiv.classList.toggle("hidden", !value);
          }, "onUpdate")
        },
        sdQcModel: { element: elements.sdQcModelSelect, event: "change" },
        sdQcPrompt: { element: elements.sdQcPromptTextarea, event: "input" },
        sdQcRetries: { element: elements.sdQcRetriesInput, event: "input" },
        sdPromptImproveModel: { element: elements.sdPromptImproveModelSelect, event: "change" },
        sdPromptImproveSystemPrompt: { element: elements.sdPromptImproveSystemPromptTextarea, event: "input" }
      };
      for (const key in settingsMap) {
        const { element, event, onUpdate, getValue } = settingsMap[key];
        setupInstantSave(element, key, event, onUpdate, getValue);
      }
      if (elements.openrouterModelInput) {
        elements.openrouterModelInput.addEventListener("input", async () => {
          if (!state.activeProfile) return;
          const value = elements.openrouterModelInput.value.trim();
          state.settings.modelName = value;
          state.activeProfile.settings.modelName = value;
          await dbUtils.updateProfile(state.activeProfile);
          appLogic.markAsDirtyAndSchedulePush("structural");
        });
      }
      if (elements.additionalModelsTextarea) {
        elements.additionalModelsTextarea.addEventListener("blur", () => {
          uiUtils.updateUserModelOptions();
        });
      }
      elements.memoryToggleBtn.addEventListener("click", () => this.toggleChatMemory());
      elements.manageMemoryBtn.addEventListener("click", () => this.openMemoryManagementDialog());
      elements.closeMemoryDialogBtn.addEventListener("click", () => elements.memoryManagementDialog.close());
      elements.addMemoryBtn.addEventListener("click", () => this.addMemoryItem());
      elements.deleteAllMemoryBtn.addEventListener("click", () => this.confirmDeleteAllMemory());
      elements.characterProfileBtn.addEventListener("click", () => this.openCharacterProfileDialog());
      elements.closeProfileDialogBtn.addEventListener("click", () => elements.characterProfileDialog.close());
      elements.profileBackBtn.addEventListener("click", () => {
        elements.characterProfileDialog.classList.remove("details-visible");
      });
      elements.overlayOpacitySlider.addEventListener("input", (event) => {
        elements.overlayOpacityValue.textContent = `${event.target.value}%`;
      });
      elements.messageOpacitySlider.addEventListener("input", (event) => {
        elements.messageOpacityValue.textContent = `${event.target.value}%`;
      });
      elements.importHistoryBtn.addEventListener("click", () => elements.importHistoryInput.click());
      elements.importHistoryInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) this.handleHistoryImport(file);
        event.target.value = null;
      });
      elements.includeThoughtsToggle.addEventListener("change", () => {
        const isEnabled = elements.includeThoughtsToggle.checked;
        elements.thoughtTranslationOptionsDiv.classList.toggle("hidden", !isEnabled);
      });
      elements.enableApiTimeoutCheckbox.addEventListener("change", () => {
        uiUtils.updateApiTimeoutOptionsVisibility();
      });
      elements.updateAppBtn.addEventListener("click", () => this.updateApp());
      elements.clearDataBtn.addEventListener("click", () => this.confirmClearAllData());
      elements.enableProofreadingCheckbox.addEventListener("change", () => {
        const isEnabled = elements.enableProofreadingCheckbox.checked;
        elements.proofreadingOptionsDiv.classList.toggle("hidden", !isEnabled);
      });
      elements.uploadBackgroundBtn.addEventListener("click", () => elements.backgroundImageInput.click());
      elements.backgroundImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) this.handleBackgroundImageUpload(file);
        event.target.value = null;
      });
      elements.deleteBackgroundBtn.addEventListener("click", () => this.confirmDeleteBackgroundImage());
      elements.resetHeaderColorBtn.addEventListener("click", () => {
        state.settings.headerColor = "";
        elements.headerColorInput.value = state.settings.darkMode ? "#908675" : "#908675";
        const event = new Event("input", { bubbles: true });
        elements.headerColorInput.dispatchEvent(event);
      });
      elements.messageContainer.addEventListener("click", (event) => {
        if (event.target.tagName === "IMG" && event.target.closest(".message-content")) {
          const modalOverlay2 = document.getElementById("image-modal-overlay");
          const modalImg = document.getElementById("image-modal-img");
          if (modalOverlay2 && modalImg) {
            modalImg.src = event.target.src;
            modalOverlay2.classList.remove("hidden");
          }
        }
      });
      document.body.addEventListener("click", (event) => {
        if (!elements.messageContainer.contains(event.target)) {
          const currentlyShown = elements.messageContainer.querySelector(".message.show-actions");
          if (currentlyShown) {
            currentlyShown.classList.remove("show-actions");
          }
        }
      }, true);
      if ("visualViewport" in window) {
        window.visualViewport.addEventListener("resize", this.updateZoomState.bind(this));
        window.visualViewport.addEventListener("scroll", this.updateZoomState.bind(this));
      } else {
        console.warn("VisualViewport API is not supported in this browser.");
      }
      elements.attachFileBtn.addEventListener("click", () => uiUtils.showFileUploadDialog());
      elements.selectFilesBtn.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.multiple = true;
        fileInput.style.display = "none";
        fileInput.addEventListener("change", (event) => {
          this.handleFileSelection(event.target.files);
          document.body.removeChild(fileInput);
        });
        document.body.appendChild(fileInput);
        fileInput.click();
      });
      elements.confirmAttachBtn.addEventListener("click", () => this.confirmAttachment());
      elements.cancelAttachBtn.addEventListener("click", () => this.cancelAttachment());
      elements.fileUploadDialog.addEventListener("close", () => {
        if (elements.fileUploadDialog.returnValue !== "ok") {
          this.cancelAttachment();
        }
      });
      document.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (button && !button.disabled) {
          this.createRipple(e, button);
        }
      });
      const chatScreen = elements.chatScreen;
      chatScreen.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!state.isSending) {
          chatScreen.classList.add("drag-over");
        }
      });
      chatScreen.addEventListener("dragleave", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.relatedTarget === null || !chatScreen.contains(event.relatedTarget)) {
          chatScreen.classList.remove("drag-over");
        }
      });
      chatScreen.addEventListener("drop", (event) => {
        event.preventDefault();
        event.stopPropagation();
        chatScreen.classList.remove("drag-over");
        if (state.isSending) return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
          console.log(`${files.length}個のファイルがドロップされました。`);
          this.handleFileSelection(files);
          uiUtils.showFileUploadDialog();
        }
      });
      const fileUploadDialog = elements.fileUploadDialog;
      fileUploadDialog.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      fileUploadDialog.addEventListener("dragleave", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      fileUploadDialog.addEventListener("drop", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (state.isSending) return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
          console.log(`${files.length}個のファイルがダイアログにドロップされました。`);
          this.handleFileSelection(files);
          uiUtils.updateSelectedFilesUI();
        }
      });
      const modalOverlay = document.getElementById("image-modal-overlay");
      const modalCloseBtn = document.getElementById("image-modal-close");
      if (modalOverlay && modalCloseBtn) {
        modalCloseBtn.addEventListener("click", () => {
          modalOverlay.classList.add("hidden");
        });
        modalOverlay.addEventListener("click", (event) => {
          if (event.target === modalOverlay) {
            modalOverlay.classList.add("hidden");
          }
        });
      }
      elements.enableAutoRetryCheckbox.addEventListener("change", () => {
        elements.autoRetryOptionsDiv.classList.toggle("hidden", !elements.enableAutoRetryCheckbox.checked);
      });
      elements.useFixedRetryDelayCheckbox.addEventListener("change", () => {
        const useFixed = elements.useFixedRetryDelayCheckbox.checked;
        elements.fixedRetryDelayContainer.classList.toggle("hidden", !useFixed);
        elements.maxBackoffDelayContainer.classList.toggle("hidden", useFixed);
      });
      elements.modelNameSelect.addEventListener("change", () => {
        uiUtils.updateModelWarningMessage();
      });
      window.addEventListener("beforeunload", () => {
        const revokeUrls = /* @__PURE__ */ __name((cache, name) => {
          if (cache.size > 0) {
            console.log(`[Memory] ページ離脱のため、${cache.size}個の${name}URLを解放します。`);
            for (const url of cache.values()) {
              if (url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
              }
            }
            cache.clear();
          }
        }, "revokeUrls");
        revokeUrls(state.profileIconUrls, "アイコン");
        revokeUrls(state.videoUrlCache, "動画");
        revokeUrls(state.imageUrlCache, "チャット画像");
      });
      elements.assetExportBtn.addEventListener("click", () => this.handleAssetExport());
      elements.assetImportBtn.addEventListener("click", () => elements.assetImportInput.click());
      elements.assetImportInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) this.handleAssetImport(file);
        event.target.value = null;
      });
      elements.manageAssetsBtn.addEventListener("click", () => this.openAssetManagementDialog());
      elements.closeAssetDialogBtn.addEventListener("click", () => elements.assetManagementDialog.close());
      elements.deleteAllAssetsBtn.addEventListener("click", () => this.confirmDeleteAllAssets());
      elements.floatingPanelBehaviorSelect.addEventListener("change", () => {
        state.settings.floatingPanelBehavior = elements.floatingPanelBehaviorSelect.value;
        this.updateCurrentProfile();
        this.applyFloatingPanelBehavior();
      });
      elements.chatStatsBtn.addEventListener("click", () => this.showChatStats());
      elements.chatStatsCloseBtn.addEventListener("click", () => elements.chatStatsDialog.close());
      elements.summarizeHistoryBtn.addEventListener("click", () => this.startSummaryProcess());
      elements.summaryCancelBtn.addEventListener("click", () => elements.summaryDialog.close("cancel"));
      elements.summaryRegenerateBtn.addEventListener("click", () => this.regenerateSummary());
      elements.summaryConfirmBtn.addEventListener("click", () => this.confirmSummary());
      const mainContent = elements.chatScreen.querySelector(".main-content");
      mainContent.addEventListener("scroll", () => {
        this.updateScrollButtonsState();
      });
      mainContent.addEventListener("click", (event) => {
        if (state.settings.floatingPanelBehavior !== "on-click") return;
        const interactiveElements = "A, BUTTON, INPUT, TEXTAREA, SELECT, DETAILS, SUMMARY, IMG, PRE, CODE";
        if (event.target.closest(interactiveElements) || event.target.closest(".floating-action-panel")) {
          return;
        }
        const panel = elements.floatingActionPanel;
        if (panel.classList.contains("visible")) {
          clearTimeout(state.panelFadeOutTimer);
          panel.classList.remove("visible");
        } else {
          this.showActionPanel();
        }
      });
      elements.floatingActionPanel.addEventListener("mouseenter", () => clearTimeout(state.panelFadeOutTimer));
      elements.floatingActionPanel.addEventListener("mouseleave", () => this.showActionPanel());
      elements.scrollToTopBtn.addEventListener("click", () => this.scrollToTop());
      elements.scrollToBottomBtn.addEventListener("click", () => this.scrollToBottom(true));
      if (elements.scrollBottomFab) {
        elements.scrollBottomFab.addEventListener("click", () => this.scrollToBottom(true));
      }
      if (elements.userInput) {
        elements.userInput.addEventListener("focus", () => document.body.classList.add("input-focused"));
        elements.userInput.addEventListener("blur", () => document.body.classList.remove("input-focused"));
      }
      if (elements.rangeImageSaveBtn) {
        elements.rangeImageSaveBtn.addEventListener("click", () => this.enterRangeImageMode());
      }
      if (elements.rangeImageCancelBtn) {
        elements.rangeImageCancelBtn.addEventListener("click", () => this.exitRangeImageMode());
      }
      if (elements.rangeImageSaveConfirmBtn) {
        elements.rangeImageSaveConfirmBtn.addEventListener("click", () => this.confirmRangeImageSave());
      }
      if (elements.messageContainer) {
        elements.messageContainer.addEventListener(
          "click",
          (event) => {
            if (!state.rangeImageSelect?.active) return;
            const messageEl = event.target.closest?.(".message[data-index]");
            if (!messageEl || !elements.messageContainer.contains(messageEl)) return;
            event.preventDefault();
            event.stopPropagation();
            const index = parseInt(messageEl.dataset.index, 10);
            if (!Number.isNaN(index)) this.handleRangeMessageSelect(index);
          },
          true
          // capture: 内部の編集/削除ボタン等より先に処理する
        );
      }
      let headerHideTimer = null;
      window.addEventListener("online", () => {
        console.log("[Network] オンライン状態に復帰しました。同期状態を確認します。");
        if (state.sync.isDirty || state.sync.lastError) {
          console.log("[Sync] 同期が必要な変更、またはエラーが検出されたため、自動Pushを実行します。");
          this.handlePush();
        }
      });
      elements.dropboxAuthBtn.addEventListener("click", async () => {
        try {
          const APP_KEY = "nb8btcpivs6ba9u";
          const REDIRECT_URI = window.location.origin + window.location.pathname;
          const codeVerifier = appLogic._generateCodeVerifier();
          const codeChallenge = await appLogic._generateCodeChallenge(codeVerifier);
          sessionStorage.setItem("dropboxCodeVerifier", codeVerifier);
          const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&token_access_type=offline&code_challenge=${codeChallenge}&code_challenge_method=S256`;
          window.location.href = authUrl;
        } catch (error) {
          console.error("Dropbox認証の開始に失敗:", error);
          uiUtils.showCustomAlert("認証処理の開始に失敗しました。");
        }
      });
      elements.dropboxSyncBtn.addEventListener("click", async () => {
        console.log("手動同期ボタンがクリックされました。");
        if (state.sync.isSyncing) {
          uiUtils.showCustomAlert("現在、別の同期処理が実行中です。");
          return;
        }
        const tokenData = await dbUtils.getSetting("dropboxTokens");
        if (!tokenData || !tokenData.value) {
          return;
        }
        state.sync.isSyncing = true;
        this.updateSyncStatusUI("syncing", "クラウドの状態を確認中...");
        uiUtils.showProgressDialog("クラウドの状態を確認中...");
        try {
          const cloudMetadataString = await window.dropboxApi.downloadMetadata();
          if (!cloudMetadataString) {
            console.log("[Manual Sync] クラウドにデータがありません。Push処理を実行します。");
            uiUtils.updateProgressMessage("初回データをクラウドに保存中...");
            state.sync.isSyncing = false;
            await this._doPush(true);
            return;
          }
          const cloudData = JSON.parse(cloudMetadataString);
          const cloudSyncId = cloudData.syncId;
          const localSyncId = state.sync.lastSyncId;
          console.log(`[Manual Sync] Cloud syncId: ${cloudSyncId}, Local syncId: ${localSyncId}`);
          if (cloudSyncId !== localSyncId) {
            console.log("[Manual Sync] syncIdが異なります。Pull処理を実行します。");
            uiUtils.updateProgressMessage("他のブラウザのデータの変更を同期中...");
            state.sync.isSyncing = false;
            await this.handlePull(true);
            return;
          }
          console.log("[Manual Sync] syncIdは一致しています。アセットの整合性を確認します。");
          uiUtils.updateProgressMessage("アセットの整合性を確認中...");
          const { localAssets } = await this._prepareExportData();
          const cloudAssetsList = await window.dropboxApi.listAssets();
          const localAssetCount = localAssets.size;
          const cloudAssetCount = cloudAssetsList.length;
          console.log(`[Manual Sync] Local asset count: ${localAssetCount}, Cloud asset count: ${cloudAssetCount}`);
          if (localAssetCount !== cloudAssetCount || state.sync.isDirty) {
            if (state.sync.isDirty) {
              console.log("[Manual Sync] ローカルに変更（isDirty=true）があるため、Push処理を実行します。");
              uiUtils.updateProgressMessage("ローカルの変更を同期中...");
            } else {
              console.log("[Manual Sync] アセット数が一致しないため、Push処理でクラウドの状態を調整します。");
              uiUtils.updateProgressMessage("クラウドの状態を調整中...");
            }
            state.sync.isSyncing = false;
            await this._doPush(true);
            return;
          }
          console.log("[Manual Sync] syncIdとアセット数が一致しており、差分はありません。");
          this.updateSyncStatusUI("idle");
          uiUtils.hideProgressDialog();
          await uiUtils.showCustomAlert("データは既に最新の状態です。");
        } catch (error) {
          const errorMessage = error.message || "不明なエラーが発生しました。";
          this.updateSyncStatusUI("error", errorMessage);
          console.error("[Manual Sync] 手動同期処理中にエラーが発生しました:", error);
          uiUtils.hideProgressDialog();
          await uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
        } finally {
          state.sync.isSyncing = false;
        }
      });
      elements.syncStatusHeaderIcon.addEventListener("click", () => {
        uiUtils.showScreen("settings").then(() => {
          const syncGroup = document.getElementById("data-sync-group");
          if (syncGroup) {
            syncGroup.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });
      elements.dropboxRestoreBtn.addEventListener("click", async () => {
        const confirmed = await uiUtils.showCustomConfirm("クラウドのデータでローカルを上書きします。ローカルの変更は失われます。続けますか？");
        if (!confirmed) return;
        try {
          await appLogic.forceRestoreFromCloud();
        } catch (error) {
          console.error("クラウドから復元に失敗:", error);
          await uiUtils.showCustomAlert(`復元に失敗しました: ${error.message}`);
        }
      });
      elements.dropboxDisconnectBtn.addEventListener("click", async () => {
        const confirmed = await uiUtils.showCustomConfirm("Dropboxとの連携を解除しますか？同期されなくなります。");
        if (confirmed) {
          try {
            await window.dropboxApi.disconnect();
            await appLogic.updateDropboxUIState();
            await uiUtils.showCustomAlert("連携を解除しました。");
          } catch (error) {
            console.error("Dropbox連携解除に失敗:", error);
            await uiUtils.showCustomAlert(`連携解除に失敗しました: ${error.message}`);
          }
        }
      });
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const showHeaderPC = /* @__PURE__ */ __name(() => {
          if (state.settings.headerAutoHide) {
            clearTimeout(headerHideTimer);
            document.body.classList.add("header-force-show");
          }
        }, "showHeaderPC");
        const hideHeaderPC = /* @__PURE__ */ __name(() => {
          if (state.settings.headerAutoHide) {
            headerHideTimer = setTimeout(() => {
              document.body.classList.remove("header-force-show");
            }, 200);
          }
        }, "hideHeaderPC");
        elements.headerTriggerArea.addEventListener("mouseenter", showHeaderPC);
        elements.appHeader.addEventListener("mouseenter", showHeaderPC);
        elements.headerTriggerArea.addEventListener("mouseleave", hideHeaderPC);
        elements.appHeader.addEventListener("mouseleave", hideHeaderPC);
      }
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const mainContent2 = elements.chatScreen.querySelector(".main-content");
        mainContent2.addEventListener("click", (event) => {
          if (state.settings.headerAutoHide) {
            const interactiveElements = "A, BUTTON, INPUT, TEXTAREA, SELECT, DETAILS, SUMMARY, IMG, PRE, CODE";
            if (!event.target.closest(interactiveElements)) {
              clearTimeout(headerHideTimer);
              const body = document.body;
              const isVisible = body.classList.contains("header-force-show");
              if (isVisible) {
                body.classList.remove("header-force-show");
              } else {
                body.classList.add("header-force-show");
                headerHideTimer = setTimeout(() => {
                  body.classList.remove("header-force-show");
                }, 5e3);
              }
            }
          }
        });
        elements.appHeader.addEventListener("touchstart", () => {
          if (state.settings.headerAutoHide) {
            clearTimeout(headerHideTimer);
          }
        }, { passive: true });
      }
      const resetHeaderVisibility = /* @__PURE__ */ __name(() => {
        document.body.classList.remove("header-force-show");
      }, "resetHeaderVisibility");
      elements.gotoHistoryBtn.addEventListener("click", resetHeaderVisibility);
      elements.gotoSettingsBtn.addEventListener("click", resetHeaderVisibility);
      elements.backToChatFromHistoryBtn.addEventListener("click", resetHeaderVisibility);
      elements.backToChatFromSettingsBtn.addEventListener("click", resetHeaderVisibility);
      const deleteOldChatsBtn = document.getElementById("delete-old-chats-btn");
      if (deleteOldChatsBtn) {
        deleteOldChatsBtn.addEventListener("click", async () => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
          const allChats = await dbUtils.getAllChats();
          const chatsToDelete = allChats.filter((chat) => chat.updatedAt < sevenDaysAgo);
          if (chatsToDelete.length === 0) {
            await uiUtils.showCustomAlert("削除対象の古いチャットはありません。");
            return;
          }
          const confirmed = await uiUtils.showCustomConfirm(
            `${chatsToDelete.length}件の古いチャット（7日以上更新なし）を削除しますか？
この操作は元に戻せません。`
          );
          if (confirmed) {
            uiUtils.showProgressDialog("古いチャットを削除中...");
            try {
              for (const chat of chatsToDelete) {
                if (chat.id !== state.currentChatId) {
                  await dbUtils.deleteChat(chat.id);
                }
              }
              this.markAsDirtyAndSchedulePush("structural");
              await uiUtils.showCustomAlert(`${chatsToDelete.length}件の古いチャットを削除しました。`);
              await uiUtils.renderHistoryList();
            } catch (error) {
              console.error("古いチャットの一括削除エラー:", error);
              await uiUtils.showCustomAlert(`削除中にエラーが発生しました: ${error.message}`);
            } finally {
              uiUtils.hideProgressDialog();
            }
          }
        });
      }
      elements.sdTestConnectionBtn.addEventListener("click", async () => {
        const url = elements.sdApiUrlInput.value.trim().replace(/\/$/, "");
        if (!url) {
          return uiUtils.showCustomAlert("先にWebUIのURLを入力してください。");
        }
        const endpoint = `${url}/sdapi/v1/progress`;
        const headers = {};
        if (elements.sdApiUserInput.value && elements.sdApiPasswordInput.value) {
          headers["Authorization"] = "Basic " + btoa(`${elements.sdApiUserInput.value}:${elements.sdApiPasswordInput.value}`);
        }
        try {
          const response = await fetch(endpoint, { headers });
          if (response.ok) {
            await uiUtils.showCustomAlert("接続に成功しました！");
          } else {
            throw new Error(`サーバーからの応答が不正です (ステータス: ${response.status})`);
          }
        } catch (error) {
          console.error("SD接続テストエラー:", error);
          await uiUtils.showCustomAlert(`接続に失敗しました。
URL、認証情報、Forge/Reforgeの起動オプション(--listen)を確認してください。
エラー: ${error.message}`);
        }
      });
      elements.sdEnableQualityCheckerCheckbox.addEventListener("change", (event) => {
        elements.sdQualityCheckerOptionsDiv.classList.toggle("hidden", !event.target.checked);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this._checkAndResetApiUsage();
        }
      });
      elements.debugLogBtn.addEventListener("click", () => this.openLogDialog());
      elements.closeLogDialogBtn.addEventListener("click", () => elements.debugLogDialog.close());
      elements.clearLogsBtn.addEventListener("click", () => this.clearLogs());
      elements.copyLogsBtn.addEventListener("click", () => this.copyLogsToClipboard());
    },
    // popstateイベントハンドラ (戻るボタン/ジェスチャー)
    handlePopState(event) {
      const targetScreen = event.state?.screen || "chat";
      if (targetScreen === state.currentScreen) {
        console.log(`[popstate] same screen -> ignore: ${targetScreen}`);
        return;
      }
      console.log(`popstate event fired: Navigating to screen '${targetScreen}' from history state.`);
      uiUtils.showScreen(targetScreen, true);
    },
    // ズーム状態を更新
    updateZoomState() {
      if ("visualViewport" in window) {
        const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
        if (state.isZoomed !== newZoomState) {
          state.isZoomed = newZoomState;
          console.log(`Zoom state updated: ${state.isZoomed}`);
          document.body.classList.toggle("zoomed", state.isZoomed);
        }
      }
    },
    // --- スワイプ処理 (ズーム対応) ---
    handleTouchStart(event) {
      if (!state.settings.enableSwipeNavigation) return;
      if (event.touches.length > 1 || state.isZoomed) {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.isSwiping = false;
        return;
      }
      state.touchStartX = event.touches[0].clientX;
      state.touchStartY = event.touches[0].clientY;
      state.isSwiping = false;
      state.touchEndX = state.touchStartX;
      state.touchEndY = state.touchStartY;
    },
    handleTouchMove(event) {
      if (!state.settings.enableSwipeNavigation) return;
      if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
        return;
      }
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const diffX = state.touchStartX - currentX;
      const diffY = state.touchStartY - currentY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        state.isSwiping = true;
        event.preventDefault();
      } else {
        state.isSwiping = false;
      }
      state.touchEndX = currentX;
      state.touchEndY = currentY;
    },
    handleTouchEnd(event) {
      if (!state.settings.enableSwipeNavigation) {
        this.resetSwipeState();
        return;
      }
      this.updateZoomState();
      if (state.isZoomed) {
        console.log("Zoomed state detected on touchend, skipping swipe navigation.");
        this.resetSwipeState();
        return;
      }
      if (!state.isSwiping || !state.touchStartX) {
        this.resetSwipeState();
        return;
      }
      const diffX = state.touchStartX - state.touchEndX;
      const diffY = state.touchStartY - state.touchEndY;
      if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          console.log("左スワイプ検出 -> 設定画面へ");
          uiUtils.showScreen("settings");
        } else {
          console.log("右スワイプ検出 -> 履歴画面へ");
        }
      } else {
        console.log("スワイプ距離不足 or 縦移動大");
      }
      this.resetSwipeState();
    },
    resetSwipeState() {
      state.touchStartX = 0;
      state.touchStartY = 0;
      state.touchEndX = 0;
      state.touchEndY = 0;
      state.isSwiping = false;
    },
    // -------------------------------
    // アプリを更新 (キャッシュクリア)
    async updateApp() {
      if (!("serviceWorker" in navigator)) {
        const doReload = await uiUtils.showCustomConfirm("お使いのブラウザはService Workerをサポートしていません。\nページを強制リロードして最新版を取得しますか？");
        if (doReload) window.location.reload(true);
        return;
      }
      const confirmed = await uiUtils.showCustomConfirm("アプリのキャッシュをクリアして最新版を再取得しますか？ (ページがリロードされます)");
      if (!confirmed) return;
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        window.location.reload(true);
      } catch (error) {
        console.error("Service Workerの処理中にエラー:", error);
        window.location.reload(true);
      }
    },
    // 全データ削除の確認と実行
    async confirmClearAllData() {
      const confirmed = await uiUtils.showCustomConfirm("本当にすべてのデータ（チャット履歴、プロファイル、アセット、設定）を削除しますか？この操作は元に戻せません。");
      if (confirmed) {
        try {
          uiUtils.revokeExistingObjectUrl();
          await dbUtils.clearAllData();
          await uiUtils.showCustomAlert("すべてのデータが削除されました。アプリをリセットします。");
          window.location.reload();
        } catch (error) {
          await uiUtils.showCustomAlert(`データ削除中にエラーが発生しました: ${error}`);
        }
      }
    },
    createRipple(event, button) {
      const existingRipple = button.querySelector(".ripple");
      if (existingRipple) {
        existingRipple.remove();
      }
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      circle.style.width = circle.style.height = `${diameter}px`;
      const rect = button.getBoundingClientRect();
      circle.style.left = `${event.clientX - rect.left - radius}px`;
      circle.style.top = `${event.clientY - rect.top - radius}px`;
      circle.classList.add("ripple");
      button.appendChild(circle);
      setTimeout(() => {
        if (circle.parentElement) {
          circle.remove();
        }
      }, 600);
    },
    // --- Function Calling用ヘルパー ---
    async updateOpacitySettings(opacitySettings) {
      let settingsChanged = false;
      const changedItems = [];
      if (typeof opacitySettings.overlay === "number" && opacitySettings.overlay >= 0 && opacitySettings.overlay <= 1) {
        state.settings.overlayOpacity = opacitySettings.overlay;
        await dbUtils.saveSetting("overlayOpacity", state.settings.overlayOpacity);
        document.documentElement.style.setProperty("--overlay-opacity-value", state.settings.overlayOpacity);
        changedItems.push(`オーバーレイの濃さを${Math.round(opacitySettings.overlay * 100)}%に`);
        settingsChanged = true;
      }
      if (typeof opacitySettings.message_bubble === "number" && opacitySettings.message_bubble >= 0.1 && opacitySettings.message_bubble <= 1) {
        state.settings.messageOpacity = opacitySettings.message_bubble;
        await dbUtils.saveSetting("messageOpacity", state.settings.messageOpacity);
        changedItems.push(`メッセージバブルの濃さを${Math.round(opacitySettings.message_bubble * 100)}%に`);
        settingsChanged = true;
      }
      if (settingsChanged) {
        uiUtils.applySettingsToUI();
        const message = `${changedItems.join("、")}変更しました。`;
        return { success: true, message };
      } else {
        return { success: false, message: "有効な値が指定されなかったため、UIは変更されませんでした。" };
      }
    },
    applyFloatingPanelBehavior() {
      const behavior = state.settings.floatingPanelBehavior;
      const panel = elements.floatingActionPanel;
      clearTimeout(state.panelFadeOutTimer);
      if (behavior === "always") {
        panel.classList.add("visible");
      } else if (behavior === "hidden") {
        panel.classList.remove("visible");
      } else {
        panel.classList.remove("visible");
      }
    },
    showActionPanel() {
      const behavior = state.settings.floatingPanelBehavior;
      const panel = elements.floatingActionPanel;
      if (behavior === "always" || behavior === "hidden") {
        return;
      }
      clearTimeout(state.panelFadeOutTimer);
      panel.classList.add("visible");
      state.panelFadeOutTimer = setTimeout(() => {
        panel.classList.remove("visible");
      }, 5e3);
    },
    updateScrollButtonsState() {
      const mainContent = elements.chatScreen.querySelector(".main-content");
      if (!mainContent) return;
      const isAtTop = mainContent.scrollTop < 50;
      const isAtBottom = mainContent.scrollHeight - mainContent.scrollTop - mainContent.clientHeight < 50;
      elements.scrollToTopBtn.disabled = isAtTop;
      elements.scrollToBottomBtn.disabled = isAtBottom;
      if (elements.scrollBottomFab) {
        elements.scrollBottomFab.classList.toggle("hidden", isAtBottom);
      }
    },
    scrollToTop() {
      const mainContent = elements.chatScreen.querySelector(".main-content");
      if (!mainContent) return;
      const startY = mainContent.scrollTop;
      const endY = 0;
      const distance = endY - startY;
      const duration = 300;
      let startTime = null;
      if (distance === 0) return;
      const step = /* @__PURE__ */ __name((currentTime) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedT = 1 - Math.pow(1 - t, 3);
        mainContent.scrollTop = startY + distance * easedT;
        if (elapsed < duration) {
          requestAnimationFrame(step);
        } else {
          mainContent.scrollTop = endY;
        }
      }, "step");
      requestAnimationFrame(step);
    },
    scrollToBottom(force = false) {
      const mainContent = elements.chatScreen.querySelector(".main-content");
      if (!mainContent) return;
      if (!state.settings.autoScroll && !force) {
        return;
      }
      const startY = mainContent.scrollTop;
      const duration = 300;
      let startTime = null;
      const step = /* @__PURE__ */ __name((currentTime) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const endY = mainContent.scrollHeight - mainContent.clientHeight;
        const distance = endY - startY;
        const t = Math.min(elapsed / duration, 1);
        const easedT = 1 - Math.pow(1 - t, 3);
        mainContent.scrollTop = startY + distance * easedT;
        if (elapsed < duration) {
          requestAnimationFrame(step);
        } else {
          mainContent.scrollTop = mainContent.scrollHeight;
        }
      }, "step");
      requestAnimationFrame(step);
    },
    // --- デバッグログUI関連 ---
    toggleDebugLogButtonVisibility(isEnabled) {
      elements.debugLogBtn.classList.toggle("hidden", !isEnabled);
    },
    openLogDialog() {
      this.renderLogDialogContent();
      elements.debugLogDialog.showModal();
    },
    renderLogDialogContent() {
      const logs = DebugLogger.getLogs();
      const container = elements.logContainer;
      const fragment = document.createDocumentFragment();
      const LOG_TRUNCATE_THRESHOLD = 200;
      if (logs.length === 0) {
        container.innerHTML = '<div class="log-entry">ログはありません。</div>';
        return;
      }
      logs.forEach((log) => {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("log-entry", `log-type-${log.type}`);
        const timestampSpan = document.createElement("span");
        timestampSpan.className = "log-timestamp";
        timestampSpan.textContent = log.timestamp.toLocaleTimeString("ja-JP", { hour12: false });
        const typeSpan = document.createElement("span");
        typeSpan.className = "log-type";
        typeSpan.textContent = `[${log.type}]`;
        entryDiv.appendChild(timestampSpan);
        entryDiv.appendChild(typeSpan);
        const messageText = log.args.join(" ");
        if (messageText.length > LOG_TRUNCATE_THRESHOLD) {
          entryDiv.classList.add("collapsible");
          const summarySpan = document.createElement("span");
          summarySpan.className = "log-summary";
          summarySpan.textContent = messageText.substring(0, LOG_TRUNCATE_THRESHOLD) + "... (クリックして展開)";
          const fullSpan = document.createElement("span");
          fullSpan.className = "log-full hidden";
          fullSpan.textContent = messageText;
          entryDiv.appendChild(summarySpan);
          entryDiv.appendChild(fullSpan);
          entryDiv.addEventListener("click", () => {
            summarySpan.classList.toggle("hidden");
            fullSpan.classList.toggle("hidden");
          });
        } else {
          const messageNode = document.createTextNode(messageText);
          entryDiv.appendChild(messageNode);
        }
        fragment.appendChild(entryDiv);
      });
      container.innerHTML = "";
      container.appendChild(fragment);
      container.scrollTop = container.scrollHeight;
    },
    clearLogs() {
      DebugLogger.clearLogs();
      this.renderLogDialogContent();
    },
    async copyLogsToClipboard() {
      const logs = DebugLogger.getLogs();
      if (logs.length === 0) {
        await uiUtils.showCustomAlert("コピーするログがありません。");
        return;
      }
      const textToCopy = logs.map((log) => {
        const time = log.timestamp.toISOString();
        const message = log.args.join(" ");
        return `${time} [${log.type}] ${message}`;
      }).join("\n");
      try {
        await navigator.clipboard.writeText(textToCopy);
        await uiUtils.showCustomAlert("ログをクリップボードにコピーしました。");
      } catch (err) {
        console.error("クリップボードへのコピーに失敗:", err);
        await uiUtils.showCustomAlert("クリップボードへのコピーに失敗しました。");
      }
    }
  };

  // src/app-logic/sync.js
  var syncMethods = {
    // 復旧ダイアログを表示するヘルパー関数
    async showRecoveryDialog() {
      const pullConfirm = await uiUtils.showCustomConfirm(
        "【同期エラーの復旧】\n\n前回の同期が正常に完了しなかったようです。\n\nクラウドのデータで現在のブラウザのデータを上書き復元しますか？ (推奨)\n\n※「キャンセル」を押すと、ローカルのデータでクラウドを上書きする選択肢が表示されます。"
      );
      if (pullConfirm) {
        return "pull";
      }
      const pushConfirm = await uiUtils.showCustomConfirm(
        "【同期エラーの復旧】\n\n現在のブラウザのデータで、クラウド上のデータを強制的に上書きしますか？\n\n※ 他のデバイスで行った変更が失われる可能性があります。"
      );
      if (pushConfirm) {
        return "push";
      }
      return "cancel";
    },
    /**
     * 同期関連の初期化処理
     */
    async initializeSyncState() {
      const [lastSyncIdSetting, isDirtySetting, lastErrorSetting] = await Promise.all([
        dbUtils.getSetting("lastSyncId"),
        dbUtils.getSetting("syncIsDirty"),
        dbUtils.getSetting("syncLastError")
      ]);
      state.sync.lastSyncId = lastSyncIdSetting ? lastSyncIdSetting.value : null;
      state.sync.isDirty = isDirtySetting ? isDirtySetting.value : false;
      state.sync.lastError = lastErrorSetting ? lastErrorSetting.value : null;
      console.log(`[Sync] 同期状態を初期化しました。lastSyncId: ${state.sync.lastSyncId}, isDirty: ${state.sync.isDirty}, lastError:`, state.sync.lastError);
    },
    /**
     * ローカルデータに変更があったことを記録し、設定に応じてPush処理をスケジュールする
     * @param {boolean} [forcePush=false] - trueの場合、同期頻度の設定を無視して即時Pushを実行する
     */
    markAsDirtyAndSchedulePush(type = "message") {
      const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      const normalizedType = type === true ? "structural" : type;
      console.log(`[SYNC_DEBUG ${timestamp}] markAsDirtyAndSchedulePush called. type=${normalizedType}, isSending=${state.isSending}, isSyncing=${state.sync.isSyncing}, isDirty=${state.sync.isDirty}`);
      const tokenDataPromise = dbUtils.getSetting("dropboxTokens");
      if (!tokenDataPromise) {
        console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Dropbox not connected.`);
        return;
      }
      if (state.sync.isSyncing) {
        console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Already syncing.`);
        return;
      }
      if (!state.sync.isDirty) {
        state.sync.isDirty = true;
        dbUtils.saveSetting("syncIsDirty", true);
        console.log(`[SYNC_DEBUG ${timestamp}] -> State set to DIRTY.`);
      }
      this.updateSyncStatusUI("dirty");
      if (normalizedType === "message" && state.isSending) {
        console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: AI is responding (isSending=true).`);
        return;
      }
      const frequency = state.settings.dropboxSyncFrequency;
      if (frequency === "manual") {
        if (normalizedType === "message") {
          console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Manual sync mode for message update.`);
          return;
        }
        console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Structural change detected in manual sync mode. Forcing push.`);
        this.handlePush();
        return;
      }
      if (normalizedType !== "message") {
        console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Non-message change detected. Triggering push immediately.`);
        this.handlePush();
        return;
      }
      state.syncMessageCounter++;
      console.log(`[SYNC_DEBUG ${timestamp}] Message counter incremented to: ${state.syncMessageCounter}`);
      if (state.sync.pushTimeoutId) {
        clearTimeout(state.sync.pushTimeoutId);
        state.sync.pushTimeoutId = null;
      }
      if (frequency === "instant") {
        console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Instant mode, pushing immediately.`);
        this.handlePush();
        state.syncMessageCounter = 0;
        return;
      }
      const threshold = parseInt(frequency, 10);
      if (!isNaN(threshold)) {
        if (state.syncMessageCounter >= threshold) {
          console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Threshold (${threshold}) reached. Triggering push immediately.`);
          this.handlePush();
          state.syncMessageCounter = 0;
        } else {
          console.log(`[SYNC_DEBUG ${timestamp}] -> WAITING: Threshold (${threshold}) not reached yet.`);
        }
        return;
      }
      console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Unrecognized frequency '${frequency}'. Triggering push as fallback.`);
      this.handlePush();
      state.syncMessageCounter = 0;
    },
    /**
     * 同期競合時の3択ダイアログ（マージ / クラウドで上書き / キャンセル）
     * @private
     */
    _showSyncConflictDialog(isDirty) {
      return new Promise((resolve) => {
        const dialog = document.createElement("dialog");
        dialog.style.cssText = "padding:20px;max-width:420px;width:90%;border-radius:12px;border:1px solid var(--border-primary);background:var(--bg-secondary);color:var(--text-primary);font-family:inherit;";
        const subMsg = isDirty ? "このデバイスには未同期の変更があります。" : "このデバイスにもローカルのデータが存在します。";
        dialog.innerHTML = `
                <div style="font-weight:bold;margin-bottom:10px;font-size:1.05em;">【データの競合】</div>
                <p style="font-size:0.9em;margin-bottom:16px;line-height:1.6;">クラウドに別のデバイスで更新されたデータがあります。<br>${subMsg}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <button data-result="merge" style="padding:10px 14px;background:#2196a8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9em;text-align:left;line-height:1.5;">
                        両方残す（推奨）<br><span style="font-size:0.8em;opacity:0.85;">両デバイスのチャット・プロジェクトをまとめる</span>
                    </button>
                    <button data-result="overwrite" style="padding:10px 14px;background:#c62828;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9em;text-align:left;line-height:1.5;">
                        クラウドに合わせる<br><span style="font-size:0.8em;opacity:0.85;">⚠️ このブラウザのログは全て消えます</span>
                    </button>
                    <button data-result="cancel" style="padding:10px 14px;background:transparent;color:var(--text-primary);border:1px solid var(--border-primary);border-radius:8px;cursor:pointer;font-size:0.9em;">キャンセル</button>
                </div>`;
        document.body.appendChild(dialog);
        dialog.showModal();
        const cleanup = /* @__PURE__ */ __name((result) => {
          dialog.close();
          document.body.removeChild(dialog);
          resolve(result);
        }, "cleanup");
        dialog.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-result]");
          if (btn) cleanup(btn.dataset.result);
        });
        dialog.addEventListener("cancel", () => cleanup("cancel"));
      });
    },
    /**
     * ローカルとクラウドのデータをマージしてインポートし、マージ結果をCloudにPushする
     * @private
     */
    async _mergeAndSyncWithCloud(cloudMetadataString, isManual) {
      const cloudParsed = JSON.parse(cloudMetadataString);
      if (cloudParsed.version !== "2.0" || !cloudParsed.data) throw new Error("クラウドデータの形式が無効です。");
      const cloudData = cloudParsed.data;
      if (isManual) uiUtils.showProgressDialog("ローカルデータを収集中...");
      const { metadataJson } = await this._prepareExportData();
      const localData = JSON.parse(metadataJson).data;
      if (isManual) uiUtils.updateProgressMessage("データをマージ中...");
      const chatMap = /* @__PURE__ */ new Map();
      [...localData.chats || [], ...cloudData.chats || []].forEach((chat) => {
        const existing = chatMap.get(chat.id);
        if (!existing || (chat.updatedAt || 0) > (existing.updatedAt || 0)) chatMap.set(chat.id, chat);
      });
      const projectMap = /* @__PURE__ */ new Map();
      [...localData.projects || [], ...cloudData.projects || []].forEach((p) => {
        const existing = projectMap.get(p.id);
        if (!existing || (p.updatedAt || 0) > (existing.updatedAt || 0)) projectMap.set(p.id, p);
      });
      const memoryMap = /* @__PURE__ */ new Map();
      [...localData.memories || [], ...cloudData.memories || []].forEach((m) => {
        const existing = memoryMap.get(m.profileId);
        if (!existing) {
          memoryMap.set(m.profileId, { ...m });
        } else {
          existing.items = [.../* @__PURE__ */ new Set([...existing.items || [], ...m.items || []])];
        }
      });
      const profileMap = /* @__PURE__ */ new Map();
      [...cloudData.profiles || [], ...localData.profiles || []].forEach((p) => {
        if (!profileMap.has(p.id)) profileMap.set(p.id, p);
      });
      const assetMap = /* @__PURE__ */ new Map();
      [...cloudData.assets || [], ...localData.assets || []].forEach((a) => {
        if (a.assetId && !assetMap.has(a.assetId)) assetMap.set(a.assetId, a);
      });
      const mergedMetadata = {
        version: "2.0",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        syncId: "sync_merge_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
        data: {
          profiles: Array.from(profileMap.values()),
          chats: Array.from(chatMap.values()),
          memories: Array.from(memoryMap.values()),
          projects: Array.from(projectMap.values()),
          assets: Array.from(assetMap.values()),
          settings: localData.settings
        }
      };
      if (isManual) uiUtils.updateProgressMessage("マージデータをインポート中...");
      await this.importDataFromString(JSON.stringify(mergedMetadata));
      state.sync.lastSyncId = cloudParsed.syncId;
      await dbUtils.saveSetting("lastSyncId", cloudParsed.syncId);
      state.sync.isDirty = true;
      await dbUtils.saveSetting("syncIsDirty", true);
      state.sync.isSyncing = false;
      if (isManual) uiUtils.showProgressDialog("マージ結果をクラウドにアップロード中...");
      await this._doPush(isManual);
      await dbUtils.saveSetting("activeProjectId", null);
      if (isManual) {
        sessionStorage.setItem("isSyncReload", "true");
        const localCnt = (localData.chats || []).length;
        const cloudCnt = (cloudData.chats || []).length;
        await uiUtils.showCustomAlert(
          `マージが完了しました。

ローカル ${localCnt}件 + クラウド ${cloudCnt}件 → ${chatMap.size}件のチャット

アプリを再起動します。`
        );
        window.location.reload();
      } else {
        console.log(`[Sync Merge] 自動マージ完了。ローカル${(localData.chats || []).length}件 + クラウド${(cloudData.chats || []).length}件 → ${chatMap.size}件。ソフトリロードします。`);
        await this._softReloadAfterMerge();
      }
    },
    async _softReloadAfterMerge() {
      try {
        this.updateSyncStatusUI("syncing", "データを更新中...");
        if (window.state) window.state.activeProjectId = null;
        const projSelect = document.getElementById("header-project-select");
        if (projSelect) projSelect.value = "";
        await this.loadProfiles();
        if (window.dbUtils.getAllProjects) {
          window.projectsCache = await window.dbUtils.getAllProjects();
        }
        const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
        const chats = await getAllUnfiltered();
        if (chats && chats.length > 0) {
          const targetId = state.currentChatId && chats.some((c) => c.id === state.currentChatId) ? state.currentChatId : chats[0].id;
          await this.loadChat(targetId);
        } else {
          this.startNewChat();
        }
        if (state.currentScreen === "history") {
          await this.renderHistoryList();
        }
        this.updateSyncStatusUI("success", "同期完了");
        console.log("[Sync Merge] ソフトリロード完了。");
      } catch (e) {
        console.error("[Sync Merge] ソフトリロード中にエラーが発生しました:", e);
        this.updateSyncStatusUI("error", "更新エラー");
      }
    },
    /**
     * [V2 Core Push] 実際にアップロード処理を行うコア関数
     * @private
     */
    async _doPush(isManual = false) {
      console.log(`[SYNC_DEBUG] _doPush: 開始。isManual = ${isManual}`);
      if (state.sync.isSyncing) {
        console.log("[Sync Core Push V2] 既に別の同期処理が実行中のため、今回の要求はスキップします。");
        return;
      }
      state.sync.isSyncing = true;
      const updateProgress = /* @__PURE__ */ __name((message) => {
        console.log(`[SYNC_DEBUG] updateProgress: isManual=${isManual}, message="${message}"`);
        this.updateSyncStatusUI("syncing", message);
        if (isManual) {
          console.log(`[SYNC_DEBUG] updateProgress: isManual=trueのため、updateProgressMessageを呼び出します。`);
          uiUtils.updateProgressMessage(message);
        }
      }, "updateProgress");
      updateProgress("同期準備中...");
      try {
        await window.dropboxApi.uploadLockFile("push");
        updateProgress("クラウドの状態を確認中...");
        const cloudMetadataString = await window.dropboxApi.downloadMetadata();
        if (cloudMetadataString) {
          const cloudData = JSON.parse(cloudMetadataString);
          if (cloudData.syncId !== state.sync.lastSyncId) {
            console.warn(`[Sync Push] 競合を検出。自動マージのためPullに切り替えます。Local: ${state.sync.lastSyncId}, Cloud: ${cloudData.syncId}`);
            state.sync.isSyncing = false;
            await window.dropboxApi.deleteLockFile();
            await this._mergeAndSyncWithCloud(cloudMetadataString, isManual);
            return;
          }
        }
        await window.dropboxApi.ensureAssetsFolderExists();
        updateProgress("ローカルデータを準備中...");
        const { metadataJson, localAssets } = await this._prepareExportData();
        const localAssetIds = new Set(localAssets.keys());
        if (cloudMetadataString) {
          const cloudDataForCheck = JSON.parse(cloudMetadataString);
          const cloudChatCount = cloudDataForCheck.data && cloudDataForCheck.data.chats ? cloudDataForCheck.data.chats.length : 0;
          const localMetaObj = JSON.parse(metadataJson);
          const localChatCount = localMetaObj.data && localMetaObj.data.chats ? localMetaObj.data.chats.length : 0;
          if (localChatCount === 0 && cloudChatCount > 0) {
            console.error(`[Sync Push] 安全チェック失敗: ローカルチャット数=${localChatCount}, クラウドチャット数=${cloudChatCount}。クラウドの上書きを中止します。`);
            state.sync.isSyncing = false;
            this.updateSyncStatusUI("error", "ローカルデータが空のため同期を中断しました");
            if (isManual) {
              uiUtils.hideProgressDialog();
              await uiUtils.showCustomAlert("安全のため同期を中断しました。\n\nローカルのチャット履歴が空ですが、クラウドにはデータが存在します。\nクラウドからデータを復元してから再試行してください。");
            }
            await window.dropboxApi.deleteLockFile();
            return;
          }
        }
        const cloudAssetsList = await window.dropboxApi.listAssets();
        const cloudAssetIds = new Set(cloudAssetsList.map((asset) => asset.name));
        const assetsToUploadArray = Array.from(localAssets.entries()).filter(([assetId]) => !cloudAssetIds.has(assetId)).map(([assetId, asset]) => ({ assetId, asset }));
        const assetsToDelete = Array.from(cloudAssetIds).filter((id) => !localAssetIds.has(id));
        if (assetsToUploadArray.length > 0) {
          console.log(`[Sync Core Push V2] ${assetsToUploadArray.length}個のアセットをバッチアップロードします。`);
          const progressCallback = /* @__PURE__ */ __name((current, total) => {
            updateProgress(`アセットをアップロード中 (${current}/${total})`);
          }, "progressCallback");
          await window.dropboxApi.uploadAssetsInBatches(assetsToUploadArray, progressCallback);
        } else {
          console.log("[Sync Core Push V2] アップロードする新規アセットはありません。");
        }
        const metadataObj = JSON.parse(metadataJson);
        const referencedAssetIds = /* @__PURE__ */ new Set();
        (metadataObj.data.profiles || []).forEach((p) => {
          if (p.iconAssetId) referencedAssetIds.add(p.iconAssetId);
        });
        (metadataObj.data.assets || []).forEach((a) => {
          if (a.assetId) referencedAssetIds.add(a.assetId);
        });
        (metadataObj.data.chats || []).forEach((c) => {
          (c.messages || []).forEach((m) => {
            if (m.imageIds) m.imageIds.forEach((id) => {
              if (id) referencedAssetIds.add(id);
            });
            if (m.attachments) m.attachments.forEach((att) => {
              if (att.assetId) referencedAssetIds.add(att.assetId);
            });
          });
        });
        const safeToDelete = assetsToDelete.filter((id) => !referencedAssetIds.has(id));
        if (safeToDelete.length > 0) {
          console.log(`[Sync Core Push V2] ${safeToDelete.length}個の不要なアセットを削除します。`);
          updateProgress(`${safeToDelete.length}個の不要アセットを削除中...`);
          await window.dropboxApi.deleteAssets(safeToDelete);
        }
        if (assetsToDelete.length !== safeToDelete.length) {
          console.warn(`[Sync Core Push V2] ${assetsToDelete.length - safeToDelete.length}個のアセットはローカルにないがメタデータに参照されているため削除をスキップしました。`);
        }
        updateProgress("最終データを保存中...");
        const parsedMetadata = JSON.parse(metadataJson);
        await window.dropboxApi.uploadMetadata(metadataJson);
        const syncTimestamp = new Date(parsedMetadata.exportedAt).getTime();
        state.sync.lastSyncId = parsedMetadata.syncId;
        state.sync.isDirty = false;
        state.sync.lastError = null;
        await Promise.all([
          dbUtils.saveSetting("lastSyncId", parsedMetadata.syncId),
          dbUtils.saveSetting("syncIsDirty", false),
          dbUtils.saveSetting("syncLastError", null),
          dbUtils.saveSetting("lastSyncTimestamp", syncTimestamp)
        ]);
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: "SYNC_COMPLETED",
            newSyncId: parsedMetadata.syncId,
            sourceTabId: state.tabId
          });
        }
        this.updateSyncStatusUI("idle");
        await this.updateDropboxUIState();
        console.log(`[Sync Core Push V2] Push成功。新しいsyncId: ${parsedMetadata.syncId}`);
        if (isManual) {
          uiUtils.hideProgressDialog();
        }
      } catch (error) {
        const errorMessage = error.message || "不明なアップロードエラーが発生しました。";
        this.updateSyncStatusUI("error", errorMessage);
        console.error("[Sync Core Push V2] Push処理中にエラーが発生しました:", error);
        if (isManual) {
          uiUtils.hideProgressDialog();
          uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
        }
      } finally {
        state.sync.isSyncing = false;
        await window.dropboxApi.deleteLockFile();
        console.log(`[SYNC_DEBUG] _doPush: 終了。`);
      }
    },
    /**
     * [Push Gatekeeper] ローカルの変更をDropboxにアップロードする処理の呼び出しを管理する
     */
    handlePush(isManual = false) {
      if (state.sync.isSyncing || !state.sync.isDirty) {
        return;
      }
      dbUtils.getSetting("dropboxTokens").then((tokenData) => {
        if (!tokenData || !tokenData.value) {
          return;
        }
        if (isManual) {
          uiUtils.showProgressDialog("同期を開始しています...");
        }
        this._doPush(isManual).catch((error) => {
          console.error("[Sync Push] バックグラウンドPush処理でエラー:", error);
          if (isManual) {
            uiUtils.hideProgressDialog();
            uiUtils.showCustomAlert(`同期に失敗しました: ${error.message}`);
          }
        });
      });
    },
    /**
     * 「クラウドから復元」ボタン専用: sync状態を無視してDropboxから強制取得・インポートする
     */
    async forceRestoreFromCloud() {
      const tokenData = await dbUtils.getSetting("dropboxTokens");
      if (!tokenData || !tokenData.value) {
        await uiUtils.showCustomAlert("Dropboxが接続されていません。設定画面で連携してください。");
        return;
      }
      uiUtils.showProgressDialog("クラウドからデータを取得中...");
      try {
        const cloudMetadataString = await window.dropboxApi.downloadMetadata();
        if (!cloudMetadataString) {
          uiUtils.hideProgressDialog();
          await uiUtils.showCustomAlert("クラウドにデータが見つかりませんでした。\nDropboxの接続状態を確認してください。");
          return;
        }
        const importResult = await this.importDataFromString(cloudMetadataString);
        await Promise.all([
          dbUtils.saveSetting("lastSyncId", importResult.syncId),
          dbUtils.saveSetting("syncIsDirty", false),
          dbUtils.saveSetting("syncLastError", null)
        ]);
        uiUtils.hideProgressDialog();
        await uiUtils.showCustomAlert("クラウドからデータを復元しました。再起動します。");
        await dbUtils.saveSetting("activeProjectId", null);
        sessionStorage.setItem("isSyncReload", "true");
        window.location.reload();
      } catch (error) {
        uiUtils.hideProgressDialog();
        console.error("[ForceRestore] エラー:", error);
        await uiUtils.showCustomAlert(`復元に失敗しました: ${error.message}`);
      }
    },
    /**
     * [V2 Pull] Dropboxからデータをダウンロードして同期する
     */
    async handlePull(isManual = false) {
      console.log(`[SYNC_DEBUG] handlePull: 開始。isManual = ${isManual}`);
      if (state.sync.isSyncing) {
        console.log(`[Sync Pull] スキップしました (isSyncing: ${state.sync.isSyncing})`);
        return;
      }
      const tokenData = await dbUtils.getSetting("dropboxTokens");
      if (!tokenData || !tokenData.value) {
        console.log("[Sync Pull] Dropbox未連携のためスキップしました。");
        return;
      }
      console.log("[Sync Pull V2] Pull処理を開始します。");
      state.sync.isSyncing = true;
      this.updateSyncStatusUI("syncing", "クラウドと通信中...");
      if (isManual) {
        console.log("[SYNC_DEBUG] handlePull: isManual=trueのため、showProgressDialogを呼び出します。");
        uiUtils.showProgressDialog("クラウドと通信中...");
      }
      try {
        await window.dropboxApi.uploadLockFile("pull");
        const cloudMetadataString = await window.dropboxApi.downloadMetadata();
        if (cloudMetadataString === null) {
          console.log("[Sync Pull V2] クラウドにファイルが見つかりません。");
          const getAllUnfiltered2 = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
          const localChats = await getAllUnfiltered2();
          if (localChats.length > 0 || state.sync.isDirty) {
            console.log("[Sync Pull V2] ローカルにデータが存在するため、初回Pushを実行します。");
            if (isManual) {
              console.log("[SYNC_DEBUG] handlePull: isManual=trueのため、updateProgressMessageを呼び出します。");
              uiUtils.updateProgressMessage("初回データをクラウドに保存中...");
            }
            state.sync.isSyncing = false;
            await window.dropboxApi.deleteLockFile();
            console.log(`[SYNC_DEBUG] handlePull: _doPushを呼び出します。isManual = ${isManual}`);
            await this._doPush(isManual);
          } else {
            console.log("[Sync Pull V2] ローカルもクラウドも空のため、同期処理は不要です。");
            this.updateSyncStatusUI("idle");
            if (isManual) uiUtils.hideProgressDialog();
          }
          return;
        }
        const cloudData = JSON.parse(cloudMetadataString);
        const cloudSyncId = cloudData.syncId;
        console.log(`[Sync Pull V2] Cloud syncId: ${cloudSyncId}, Local lastSyncId: ${state.sync.lastSyncId}`);
        if (cloudSyncId !== state.sync.lastSyncId) {
          const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
          const localChats = await getAllUnfiltered();
          const localHasData = localChats.length > 0;
          if (state.sync.isDirty || localHasData) {
            console.log("[Sync Pull] 競合を検出。自動マージを実行します。");
            if (isManual) uiUtils.showProgressDialog("データをマージ中...");
            await this._mergeAndSyncWithCloud(cloudMetadataString, isManual);
            return;
          }
          const importResult = await this.importDataFromString(cloudMetadataString);
          const removedAssetInfo = importResult.removedAssetInfo;
          state.sync.lastSyncId = importResult.syncId;
          state.sync.isDirty = false;
          state.sync.lastError = null;
          const syncTimestamp = new Date(importResult.exportedAt).getTime();
          await Promise.all([
            dbUtils.saveSetting("lastSyncId", importResult.syncId),
            dbUtils.saveSetting("syncIsDirty", false),
            dbUtils.saveSetting("syncLastError", null),
            dbUtils.saveSetting("lastSyncTimestamp", syncTimestamp)
          ]);
          if (broadcastChannel) {
            broadcastChannel.postMessage({
              type: "SYNC_COMPLETED",
              newSyncId: importResult.syncId,
              sourceTabId: state.tabId
            });
          }
          this.updateSyncStatusUI("idle");
          if (isManual) uiUtils.hideProgressDialog();
          await dbUtils.saveSetting("activeProjectId", null);
          if (isManual) {
            sessionStorage.setItem("isSyncReload", "true");
            let finalMessage = "クラウドからデータを同期しました。アプリを再起動します。";
            if (removedAssetInfo && Object.keys(removedAssetInfo).length > 0) {
              let cleanupDetails = "\n\n【通知】\nクラウド上で実体が見つからなかったため、以下のチャットから画像添付の記録を削除しました：\n";
              for (const chatTitle in removedAssetInfo) {
                cleanupDetails += `・「${chatTitle}」から ${removedAssetInfo[chatTitle].length} 件
`;
              }
              finalMessage += cleanupDetails;
            }
            await uiUtils.showCustomAlert(finalMessage);
            window.location.reload();
          } else {
            console.log("[Sync Pull] クラウドから自動インポート完了。ソフトリロードします。");
            await this._softReloadAfterMerge();
          }
        } else {
          console.log("[Sync Pull V2] ローカルは既に最新です。同期は不要です。");
          await dbUtils.saveSetting("lastSyncTimestamp", Date.now());
          this.updateSyncStatusUI("idle");
          await this.updateDropboxUIState();
          if (isManual) {
            uiUtils.hideProgressDialog();
          }
        }
      } catch (error) {
        const errorMessage = error.message || "不明な同期エラーが発生しました。";
        this.updateSyncStatusUI("error", errorMessage);
        console.error("[Sync Pull V2] Pull処理中にエラーが発生しました:", error);
        if (isManual) {
          uiUtils.hideProgressDialog();
          await uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
        }
      } finally {
        state.sync.isSyncing = false;
        await window.dropboxApi.deleteLockFile();
        console.log(`[SYNC_DEBUG] handlePull: 終了。`);
      }
    },
    /**
     * [V2] 同期用にメタデータとアセットリストを分離して準備する
     * @param {boolean} isManual - 手動実行かどうか
     * @returns {Promise<{metadataJson: string, localAssets: Map<string, {blob: Blob, hash: string}>}>}
     */
    async _prepareExportData() {
      try {
        const [profiles, chats, memories, projects, allSettings] = await Promise.all([
          dbUtils.getAllProfiles().then((data) => JSON.parse(JSON.stringify(data))),
          (window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils))().then((data) => JSON.parse(JSON.stringify(data))),
          dbUtils.getAllMemories().then((data) => JSON.parse(JSON.stringify(data))),
          window.dbUtils.getAllProjects().then((data) => JSON.parse(JSON.stringify(data))),
          new Promise((res, rej) => {
            const store = dbUtils._getStore(SETTINGS_STORE);
            const request = store.getAll();
            request.onsuccess = () => res(JSON.parse(JSON.stringify(request.result)));
            request.onerror = (e) => rej(e.target.error);
          })
        ]);
        const imageAssets = await dbUtils.getAllAssets();
        const chatImages = await new Promise((res, rej) => {
          const store = dbUtils._getStore("image_store");
          const request = store.getAll();
          request.onsuccess = () => res(request.result);
          request.onerror = (e) => rej(e.target.error);
        });
        const settingsForExport = allSettings.filter(
          (setting) => !["dropboxTokens", "syncIsDirty", "syncLastError", "lastSyncId"].includes(setting.key)
        );
        const localAssets = /* @__PURE__ */ new Map();
        const addAsset = /* @__PURE__ */ __name((assetId, blob) => {
          if (!assetId || !blob) return;
          localAssets.set(assetId, { blob, hash: null });
        }, "addAsset");
        for (const profile of profiles) {
          const originalProfile = await dbUtils.getProfile(profile.id);
          if (originalProfile && originalProfile.icon instanceof Blob) {
            const assetId = `profile_${profile.id}_icon.webp`;
            addAsset(assetId, originalProfile.icon);
            profile.iconAssetId = assetId;
          }
          delete profile.icon;
        }
        for (const asset of imageAssets) {
          if (asset.blob) {
            if (!asset.assetId) {
              const safeName = asset.name.replace(/[^a-zA-Z0-9]/g, "_");
              asset.assetId = `asset_${safeName}_${new Date(asset.createdAt).getTime()}.webp`;
              asset._needsUpdate = true;
            }
            addAsset(asset.assetId, asset.blob);
          }
        }
        for (const image of chatImages) {
          if (image.id && image.blob) {
            addAsset(image.id, image.blob);
          }
        }
        console.log("[Data Export V2] チャット履歴内の添付ファイルのアセット化とデータクレンジングを開始します...");
        const blobsToSaveToImageStore = [];
        const allDbChats = await dbUtils.getAllChats();
        for (const chat of allDbChats) {
          if (chat.messages) {
            for (const message of chat.messages) {
              if (message.imageIds && Array.isArray(message.imageIds)) {
                message.imageIds = message.imageIds.filter((id) => id && typeof id === "string" && id.trim() !== "");
              }
              if (message.attachments && message.attachments.length > 0) {
                const newImageIdsForMessage = [];
                for (const attachment of message.attachments) {
                  if (!attachment.assetId && attachment.base64Data) {
                    attachment.assetId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    if (!chat._needsUpdate) chat._needsUpdate = true;
                    try {
                      const blob = await this.base64ToBlob(attachment.base64Data, attachment.mimeType);
                      addAsset(attachment.assetId, blob);
                      newImageIdsForMessage.push(attachment.assetId);
                      blobsToSaveToImageStore.push({ id: attachment.assetId, blob });
                    } catch (e) {
                      console.error(`[Data Export V2] 新規添付ファイルのアセット化に失敗:`, e);
                    }
                  } else if (attachment.assetId) {
                    const imgData = chatImages.find((img) => img.id === attachment.assetId);
                    if (imgData && imgData.blob) {
                      addAsset(attachment.assetId, imgData.blob);
                    } else {
                      console.warn(`[Data Export V2] 既存アセット(ID: ${attachment.assetId})のBlobがimage_storeに見つかりません。`);
                    }
                  }
                }
                if (newImageIdsForMessage.length > 0) {
                  if (!message.imageIds) message.imageIds = [];
                  message.imageIds.push(...newImageIdsForMessage);
                }
              }
            }
          }
        }
        console.log("[Data Export V2] アセット化とクレンジングが完了しました。");
        if (blobsToSaveToImageStore.length > 0) {
          console.log(`[Data Export V2] ${blobsToSaveToImageStore.length}件の新規アセットBlobをimage_storeに永続化します。`);
          const tx = state.db.transaction("image_store", "readwrite");
          const store = tx.objectStore("image_store");
          for (const item of blobsToSaveToImageStore) {
            store.put(item);
          }
        }
        const assetsToUpdate = imageAssets.filter((a) => a._needsUpdate);
        if (assetsToUpdate.length > 0) {
          console.log(`[Data Export V2] ${assetsToUpdate.length}件のimage_assetsにassetIdを永続化します。`);
          const tx = state.db.transaction("image_assets", "readwrite");
          const store = tx.objectStore("image_assets");
          for (const asset of assetsToUpdate) {
            delete asset._needsUpdate;
            store.put(asset);
          }
        }
        const chatsToUpdate = allDbChats.filter((c) => c._needsUpdate);
        if (chatsToUpdate.length > 0) {
          console.log(`[Data Export V2] ${chatsToUpdate.length}件のチャットにattachmentのassetIdを永続化します。`);
          const tx = state.db.transaction(CHATS_STORE, "readwrite");
          const store = tx.objectStore(CHATS_STORE);
          for (const chat of chatsToUpdate) {
            const chatForDb = JSON.parse(JSON.stringify(chat));
            chatForDb.messages.forEach((msg) => {
              if (msg.attachments) {
                msg.attachments.forEach((att) => delete att.base64Data);
              }
            });
            delete chatForDb._needsUpdate;
            store.put(chatForDb);
            if (chat.id === state.currentChatId) {
              state.currentMessages = chat.messages;
            }
          }
        }
        for (const chat of chats) {
          if (chat.messages) {
            for (const message of chat.messages) {
              if (message.attachments && message.attachments.length > 0) {
                for (const attachment of message.attachments) {
                  if (!attachment.base64Data && attachment.assetId) {
                    const assetBlobData = localAssets.get(attachment.assetId);
                    if (assetBlobData && assetBlobData.blob) {
                      try {
                        attachment.base64Data = await this.fileToBase64(assetBlobData.blob);
                      } catch (e) {
                        console.error(`[Data Export V2] エクスポート中に assetId: ${attachment.assetId} から base64Data の復元に失敗しました。`, e);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        const syncId = "sync_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        const metadata = {
          version: "2.0",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          syncId,
          data: {
            profiles,
            chats,
            memories,
            projects,
            assets: imageAssets.map((a) => ({ name: a.name, assetId: a.assetId, createdAt: a.createdAt })),
            settings: settingsForExport
          }
        };
        console.log(`[Data Export V2] データ準備完了。syncId: ${syncId}, アセット数: ${localAssets.size}`);
        return {
          metadataJson: JSON.stringify(metadata),
          localAssets
        };
      } catch (error) {
        console.error("[Data Export V2] エクスポート準備中にエラー:", error);
        throw new Error("データのエクスポート準備に失敗しました。");
      }
    },
    async importDataFromString(jsonString) {
      console.log("[Data Import V2] 文字列からのデータインポートを開始します。");
      uiUtils.showProgressDialog("インポートデータを準備中...");
      try {
        const parsedData = JSON.parse(jsonString);
        if (parsedData.version !== "2.0" || !parsedData.data) {
          throw new Error("インポートデータの形式が無効か、バージョンが古いです。");
        }
        const cloudData = parsedData.data;
        const localAssetsBeforeClear = /* @__PURE__ */ new Map();
        const localImageAssets = await dbUtils.getAllAssets();
        localImageAssets.forEach((asset) => {
          if (asset.assetId && asset.blob) localAssetsBeforeClear.set(asset.assetId, asset.blob);
        });
        const localChatImages = await new Promise((res, rej) => {
          const store = dbUtils._getStore("image_store");
          const request = store.getAll();
          request.onsuccess = () => res(request.result);
          request.onerror = (e) => rej(e.target.error);
        });
        localChatImages.forEach((image) => {
          if (image.id && image.blob) localAssetsBeforeClear.set(image.id, image.blob);
        });
        console.log(`[Sync Pull] ローカルに存在するアセットBlob: ${localAssetsBeforeClear.size}件をメモリに保持しました。`);
        const requiredAssetIds = /* @__PURE__ */ new Set();
        (cloudData.profiles || []).forEach((p) => {
          if (p.iconAssetId) requiredAssetIds.add(p.iconAssetId);
        });
        (cloudData.assets || []).forEach((a) => {
          if (a.assetId) requiredAssetIds.add(a.assetId);
        });
        (cloudData.chats || []).forEach((c) => {
          (c.messages || []).forEach((m) => {
            if (m.imageIds) m.imageIds.forEach((id) => {
              if (id) requiredAssetIds.add(id);
            });
          });
        });
        console.log(`[Sync Pull] クラウドが必要とするアセットID: ${requiredAssetIds.size}件`);
        const assetsToDownloadIds = [...requiredAssetIds].filter((id) => !localAssetsBeforeClear.has(id));
        console.log(`[Sync Pull] ダウンロードが必要なアセットID: ${assetsToDownloadIds.length}件`);
        const downloadedAssets = /* @__PURE__ */ new Map();
        if (assetsToDownloadIds.length > 0) {
          for (let i = 0; i < assetsToDownloadIds.length; i++) {
            const assetId = assetsToDownloadIds[i];
            uiUtils.updateProgressMessage(`アセットをダウンロード中 (${i + 1}/${assetsToDownloadIds.length})`);
            try {
              const blob = await window.dropboxApi.downloadAsset(assetId);
              if (blob) {
                downloadedAssets.set(assetId, blob);
              } else {
                console.warn(`[Sync Pull] アセット(ID: ${assetId})のダウンロードに失敗、またはクラウドに存在しませんでした。`);
              }
            } catch (downloadError) {
              console.error(`[Sync Pull] アセット(ID: ${assetId})のダウンロード中にエラーが発生しました:`, downloadError);
            }
          }
        }
        const { removedAssetInfo } = await dbUtils.clearAndImportData(cloudData, localAssetsBeforeClear, downloadedAssets, requiredAssetIds);
        console.log("[Data Import V2] データのインポートに成功しました。");
        return {
          ...parsedData,
          // syncId, exportedAtなどを含む
          removedAssetInfo
          // クレンジング情報を追加
        };
      } catch (error) {
        console.error("[Data Import V2] インポート処理中にエラーが発生しました:", error);
        uiUtils.hideProgressDialog();
        if (error && error.missingAssetInfo) {
          const detailLines = Object.entries(error.missingAssetInfo).map(([chatTitle, ids]) => `・${chatTitle}: ${ids.length}件の画像が不足`).join("\n");
          const message = [
            "必要な画像アセットが不足しているため同期を中止しました。",
            "ネットワーク状況またはDropbox上のアセット状態を確認し、再度同期をお試しください。",
            "不足している画像一覧:",
            detailLines
          ].join("\n");
          const wrappedError = new Error(message);
          wrappedError.missingAssetInfo = error.missingAssetInfo;
          wrappedError.code = error.code || "MISSING_ASSETS";
          throw wrappedError;
        }
        throw new Error(`データのインポートに失敗しました: ${error.message}`);
      }
    },
    /**
     * [PKCE] code_verifierを生成する
     * @returns {string} ランダムな文字列
     */
    _generateCodeVerifier() {
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      return btoa(String.fromCharCode.apply(null, randomBytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    },
    /**
     * [PKCE] code_verifierからcode_challengeを生成する
     * @param {string} verifier - code_verifier
     * @returns {Promise<string>} SHA-256でハッシュ化されたチャレンジ文字列
     */
    async _generateCodeChallenge(verifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    },
    async updateDropboxUIState() {
      const tokenData = await dbUtils.getSetting("dropboxTokens");
      const isAuthenticated = tokenData && tokenData.value && tokenData.value.access_token;
      elements.syncStatusHeaderIcon.style.display = isAuthenticated ? "block" : "none";
      if (isAuthenticated) {
        document.body.classList.add("dropbox-connected");
        elements.dropboxAuthState.classList.add("hidden");
        elements.dropboxConnectedState.classList.remove("hidden");
        const lastSyncSetting = await dbUtils.getSetting("lastSyncTimestamp");
        if (lastSyncSetting && lastSyncSetting.value) {
          const date = new Date(lastSyncSetting.value);
          elements.lastSyncTimeDisplay.textContent = `最終同期: ${date.toLocaleString("ja-JP")}`;
        } else {
          elements.lastSyncTimeDisplay.textContent = `最終同期: なし`;
        }
        try {
          const accountInfo = await window.dropboxApi.testConnection();
          elements.dropboxUserName.textContent = accountInfo.name.display_name;
          this.updateSyncStatusUI(state.sync.isDirty ? "dirty" : "idle");
        } catch (error) {
          console.error("Dropboxユーザー情報の取得に失敗:", error);
          elements.dropboxUserName.textContent = "不明なユーザー";
          this.updateSyncStatusUI("error", "アカウント情報取得失敗");
        }
      } else {
        document.body.classList.remove("dropbox-connected");
        elements.dropboxAuthState.classList.remove("hidden");
        elements.dropboxConnectedState.classList.add("hidden");
        elements.lastSyncTimeDisplay.textContent = "";
        this.updateSyncStatusUI("not-connected");
      }
    },
    /**
     * 同期ステータスUIを更新する
     * @param {string} status - 'idle', 'dirty', 'pushing', 'pulling', 'error'
     * @param {string} [message] - 表示するカスタムメッセージ
     */
    updateSyncStatusUI(status, message) {
      console.log(`[Sync UI] updateSyncStatusUI called with status: "${status}", message: "${message || ""}"`);
      if (status === "error" && message) {
        state.sync.lastError = {
          message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const errorDisplay = document.getElementById("sync-error-display");
      const errorMessageEl = document.getElementById("sync-error-message");
      const errorTimestampEl = document.getElementById("sync-error-timestamp");
      if (state.sync.lastError) {
        errorMessageEl.textContent = state.sync.lastError.message;
        errorTimestampEl.textContent = `発生日時: ${new Date(state.sync.lastError.timestamp).toLocaleString("ja-JP")}`;
        errorDisplay.classList.remove("hidden");
      } else {
        errorDisplay.classList.add("hidden");
      }
      const indicators = [
        elements.syncStatusHeaderIcon,
        elements.syncStatusSettingsIcon,
        // 設定画面のアイコンを追加
        elements.syncProgressText
      ].filter(Boolean);
      const statusMap = {
        "not-connected": { text: "未連携", icon: "cloud_off" },
        "idle": { text: "同期済み", icon: "cloud_done" },
        "dirty": { text: "要同期", icon: "cloud_upload" },
        "syncing": { text: "同期中...", icon: "cloud_sync" },
        "error": { text: "同期エラー", icon: "cloud_alert" }
      };
      const newStatus = statusMap[status] ? status : "error";
      const statusInfo = statusMap[newStatus];
      indicators.forEach((element) => {
        element.dataset.status = newStatus;
        if (element.classList.contains("sync-status-header-icon")) {
          element.textContent = statusInfo.icon;
          element.title = message || statusInfo.text;
        } else if (element.id === "sync-progress-text") {
          if (newStatus === "syncing") {
            element.textContent = `(${message || statusInfo.text})`;
          } else {
            element.textContent = "";
          }
        }
      });
    }
  };

  // src/app-logic/chat.js
  var chatMethods = {
    // --- スワイプ処理ここまで ---
    // 新規チャット開始の確認と実行
    async confirmStartNewChat() {
      const confirmed = await uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？");
      if (!confirmed) {
        console.log("新規チャットの開始をキャンセルしました。");
        return;
      }
      if (state.isSending) {
        this.abortRequest();
      }
      if (state.editingMessageIndex !== null) {
        const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
        this.cancelEditMessage(state.editingMessageIndex, msgEl);
      }
      if (state.isEditingSystemPrompt) {
        this.cancelEditSystemPrompt();
      }
      if (state.pendingAttachments.length > 0) {
        state.pendingAttachments = [];
        uiUtils.updateAttachmentBadgeVisibility();
      }
      try {
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId) {
          await dbUtils.saveChat();
        }
      } catch (error) {
        console.error("新規チャット開始前のチャット保存失敗:", error);
        await uiUtils.showCustomAlert("現在のチャットの保存に失敗しました。");
      }
      this.startNewChat();
      uiUtils.showScreen("chat");
    },
    // 新規チャットを開始する (状態リセット)
    startNewChat() {
      state.pendingCascadeResponses = null;
      state.currentChatId = null;
      state.currentMessages = [];
      state.currentSystemPrompt = state.settings.systemPrompt || "";
      state.pendingAttachments = [];
      state.currentPersistentMemory = {};
      state.currentSummarizedContext = null;
      state.isMemoryEnabledForChat = true;
      state.syncMessageCounter = 0;
      this.toggleMemoryIconVisibility();
      state.currentScene = { scene_id: "initial", location: "不明な場所" };
      uiUtils.updateSystemPromptUI();
      uiUtils.renderChatMessages();
      uiUtils.updateChatTitle();
      elements.userInput.value = "";
      uiUtils.adjustTextareaHeight();
      uiUtils.setSendingState(false);
      this.updateCharacterProfileButtonVisibility();
      state.currentStyleProfiles = {};
    },
    // app.js の appLogic オブジェクト内
    async loadChat(id) {
      state.pendingCascadeResponses = null;
      const loadChatStartTime = performance.now();
      state.syncMessageCounter = 0;
      state.currentMessages = [];
      if (state.isSending) {
        const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
        if (!confirmed) return;
        this.abortRequest();
      }
      if (state.editingMessageIndex !== null) {
        const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
        if (!confirmed) return;
        const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
        this.cancelEditMessage(state.editingMessageIndex, msgEl);
      }
      if (state.isEditingSystemPrompt) {
        const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して別のチャットを読み込みますか？");
        if (!confirmed) return;
        this.cancelEditSystemPrompt();
      }
      if (state.pendingAttachments.length > 0) {
        const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
        if (!confirmedAttach) return;
        state.pendingAttachments = [];
        uiUtils.updateAttachmentBadgeVisibility();
      }
      try {
        const dbGetStartTime = performance.now();
        const chat = await dbUtils.getChat(id);
        const dbGetEndTime = performance.now();
        if (chat) {
          state.currentChatId = chat.id;
          state.currentMessages = chat.messages?.map((msg) => ({
            ...msg,
            attachments: msg.attachments || []
          })) || [];
          state.currentPersistentMemory = chat.persistentMemory || {};
          state.currentSummarizedContext = chat.summarizedContext || null;
          state.isMemoryEnabledForChat = chat.isMemoryEnabledForChat !== false;
          this.toggleMemoryIconVisibility();
          this.updateCharacterProfileButtonVisibility();
          let needsSave = false;
          const groupIds = new Set(state.currentMessages.filter((m) => m.siblingGroupId).map((m) => m.siblingGroupId));
          groupIds.forEach((gid) => {
            const siblings = state.currentMessages.filter((m) => m.siblingGroupId === gid);
            const selected = siblings.filter((m) => m.isSelected);
            if (selected.length === 0 && siblings.length > 0) {
              siblings[siblings.length - 1].isSelected = true;
              needsSave = true;
            } else if (selected.length > 1) {
              selected.slice(0, -1).forEach((m) => m.isSelected = false);
              needsSave = true;
            }
          });
          if (chat.projectId && window.projectsCache) {
            const proj = window.projectsCache.find((p) => p.id === chat.projectId);
            state.currentSystemPrompt = proj ? proj.systemPrompt || "" : chat.systemPrompt !== void 0 ? chat.systemPrompt : state.settings.systemPrompt;
          } else {
            state.currentSystemPrompt = chat.systemPrompt !== void 0 ? chat.systemPrompt : state.settings.systemPrompt;
          }
          state.pendingAttachments = [];
          uiUtils.updateChatTitle(chat.title);
          uiUtils.updateSystemPromptUI();
          const renderStartTime = performance.now();
          uiUtils.renderChatMessages();
          const renderEndTime = performance.now();
          this.scrollToBottom();
          elements.userInput.value = "";
          uiUtils.adjustTextareaHeight();
          uiUtils.setSendingState(false);
          if (needsSave) {
            console.log("読み込み時に isSelected を正規化しました。DBに保存します。");
            await dbUtils.saveChat();
          }
        } else {
          await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
          this.startNewChat();
          uiUtils.showScreen("chat");
        }
      } catch (error) {
        await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
        this.startNewChat();
      }
      const loadChatEndTime = performance.now();
    },
    // チャットを複製
    async duplicateChat(id) {
      if (state.isSending) {
        const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？");
        if (!conf) return;
        this.abortRequest();
      }
      if (state.editingMessageIndex !== null) {
        const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？");
        if (!conf) return;
        const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
        this.cancelEditMessage(state.editingMessageIndex, msgEl);
      }
      if (state.isEditingSystemPrompt) {
        const conf = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄してチャットを複製しますか？");
        if (!conf) return;
        this.cancelEditSystemPrompt();
      }
      if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId && state.currentChatId !== id) {
        try {
          await dbUtils.saveChat();
        } catch (error) {
          console.error("複製前の現チャット保存失敗:", error);
          const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？");
          if (!conf) return;
        }
      }
      if (state.pendingAttachments.length > 0) {
        const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
        if (!confirmedAttach) return;
        state.pendingAttachments = [];
      }
      try {
        const chat = await dbUtils.getChat(id);
        if (chat) {
          const originalTitle = chat.title || "無題のチャット";
          const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, "\\$1") + "$"), "").trim() + DUPLICATE_SUFFIX;
          const duplicatedMessages = [];
          const groupIdMap = /* @__PURE__ */ new Map();
          (chat.messages || []).forEach((msg) => {
            const newMsg = JSON.parse(JSON.stringify(msg));
            newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
            newMsg.isCascaded = msg.isCascaded ?? false;
            newMsg.isSelected = msg.isSelected ?? false;
            if (msg.siblingGroupId) {
              if (!groupIdMap.has(msg.siblingGroupId)) {
                groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
              }
              newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
            } else {
              delete newMsg.siblingGroupId;
            }
            duplicatedMessages.push(newMsg);
          });
          const newGroupIds = new Set(duplicatedMessages.filter((m) => m.siblingGroupId).map((m) => m.siblingGroupId));
          newGroupIds.forEach((gid) => {
            const siblings = duplicatedMessages.filter((m) => m.siblingGroupId === gid);
            siblings.forEach((m, idx) => {
              m.isSelected = idx === siblings.length - 1;
            });
          });
          const newChatData = {
            messages: duplicatedMessages,
            systemPrompt: chat.systemPrompt || "",
            // システムプロンプトもコピー
            // 永続メモリもディープコピーで複製
            persistentMemory: JSON.parse(JSON.stringify(chat.persistentMemory || {})),
            updatedAt: Date.now(),
            // 更新/作成日時は現在
            createdAt: Date.now(),
            title: newTitle
          };
          const newChatId = await new Promise((resolve, reject) => {
            const store = dbUtils._getStore(CHATS_STORE, "readwrite");
            const request = store.add(newChatData);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
          });
          this.markAsDirtyAndSchedulePush(true);
          console.log("チャット複製完了:", id, "->", newChatId);
          if (state.currentScreen === "history") {
            uiUtils.renderHistoryList();
          } else {
            await uiUtils.showCustomAlert(`チャット「${newTitle}」を複製しました。`);
          }
        } else {
          await uiUtils.showCustomAlert("複製元のチャットが見つかりません。");
        }
      } catch (error) {
        await uiUtils.showCustomAlert(`チャット複製エラー: ${error}`);
      }
    },
    // チャットをテキストファイルとしてエクスポート
    async exportChat(chatId, chatTitle) {
      const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || "この履歴"}」をテキスト出力しますか？`);
      if (!confirmed) return;
      uiUtils.showProgressDialog("エクスポート準備中...");
      try {
        let chatToExport;
        if (state.currentChatId === chatId) {
          chatToExport = {
            id: state.currentChatId,
            title: chatTitle,
            messages: state.currentMessages,
            systemPrompt: state.currentSystemPrompt,
            persistentMemory: state.currentPersistentMemory,
            summarizedContext: state.currentSummarizedContext,
            createdAt: null,
            updatedAt: Date.now()
          };
        } else {
          chatToExport = await dbUtils.getChat(chatId);
        }
        if (!chatToExport || (!chatToExport.messages || chatToExport.messages.length === 0) && !chatToExport.systemPrompt) {
          await uiUtils.showCustomAlert("チャットデータが空です。");
          return;
        }
        let exportText = "";
        const imageDataBlock = {};
        const attachmentDataBlock = {};
        const allImageIds = /* @__PURE__ */ new Set();
        if (chatToExport.messages) {
          chatToExport.messages.forEach((msg) => {
            if (msg.imageIds && msg.imageIds.length > 0) {
              msg.imageIds.forEach((id) => allImageIds.add(id));
            }
            if (msg.attachments && msg.attachments.length > 0) {
              msg.attachments.forEach((att) => {
                if (att.base64Data) {
                  const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                  att.attachmentId = attachmentId;
                  attachmentDataBlock[attachmentId] = {
                    name: att.name,
                    mimeType: att.mimeType,
                    data: att.base64Data
                  };
                }
              });
            }
          });
        }
        if (allImageIds.size > 0) {
          uiUtils.updateProgressMessage(`画像データを収集中... (0 / ${allImageIds.size})`);
          let processedCount = 0;
          for (const imageId of allImageIds) {
            try {
              const imageData = await this.getImageBlobById(imageId);
              if (imageData && imageData.blob) {
                const base64Data = await this.fileToBase64(imageData.blob);
                imageDataBlock[imageId] = {
                  mimeType: imageData.blob.type,
                  data: base64Data,
                  width: imageData.width,
                  height: imageData.height
                };
              }
            } catch (e) {
              console.error(`エクスポート中に画像(ID: ${imageId})の処理に失敗しました:`, e);
            }
            processedCount++;
            uiUtils.updateProgressMessage(`画像データを収集中... (${processedCount} / ${allImageIds.size})`);
          }
        }
        uiUtils.updateProgressMessage("テキストデータを生成中...");
        if (chatToExport.persistentMemory && Object.keys(chatToExport.persistentMemory).length > 0) {
          try {
            const metadataToExport = { ...chatToExport.persistentMemory };
            const metadataJson = JSON.stringify(metadataToExport, null, 2);
            exportText += `<|#|metadata|#|>
${metadataJson}
<|#|/metadata|#|>

`;
          } catch (e) {
            console.error("persistentMemoryのJSON化に失敗しました:", e);
          }
        }
        if (chatToExport.systemPrompt) {
          exportText += `<|#|system|#|>
${chatToExport.systemPrompt}
<|#|/system|#|>

`;
        }
        if (chatToExport.summarizedContext) {
          try {
            const summaryJson = JSON.stringify(chatToExport.summarizedContext, null, 2);
            exportText += `<|#|summary|#|>
${summaryJson}
<|#|/summary|#|>

`;
          } catch (e) {
            console.error("summarizedContextのJSON化に失敗しました:", e);
          }
        }
        if (chatToExport.messages) {
          chatToExport.messages.forEach((msg) => {
            if (msg.role === "user" || msg.role === "model") {
              let attributes = "";
              if (msg.role === "model") {
                if (msg.isCascaded) attributes += " isCascaded";
                if (msg.isSelected) attributes += " isSelected";
                if (msg.imageIds && msg.imageIds.length > 0) {
                  attributes += ` imageIds="${msg.imageIds.join(",")}"`;
                }
              }
              if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
                const attachmentIds = msg.attachments.map((a2) => a2.attachmentId).filter(Boolean).join(",");
                if (attachmentIds) {
                  attributes += ` attachments="${attachmentIds}"`;
                }
              }
              exportText += `<|#|${msg.role}|#|${attributes.trim()}>
${msg.content}
<|#|/${msg.role}|#|>

`;
            }
          });
        }
        if (Object.keys(imageDataBlock).length > 0) {
          exportText += `<|#|imagedata|#|>
${JSON.stringify(imageDataBlock, null, 2)}
<|#|/imagedata|#|>

`;
        }
        if (Object.keys(attachmentDataBlock).length > 0) {
          exportText += `<|#|attachmentdata|#|>
${JSON.stringify(attachmentDataBlock, null, 2)}
<|#|/attachmentdata|#|>
`;
        }
        uiUtils.updateProgressMessage("ファイルをダウンロード中...");
        const blob = new Blob([exportText.trim()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeTitle = (chatToExport.title || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, "_");
        a.href = url;
        a.download = `${safeTitle}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("チャットエクスポート完了:", chatId);
      } catch (error) {
        await uiUtils.showCustomAlert(`エクスポートエラー: ${error}`);
      } finally {
        uiUtils.hideProgressDialog();
      }
    },
    // チャット削除の確認と実行 (メッセージペア全体)
    async confirmDeleteChat(id, title) {
      const confirmed = await uiUtils.showCustomConfirm(`「${title || "この履歴"}」を削除しますか？`);
      if (confirmed) {
        const isDeletingCurrent = state.currentChatId === id;
        const currentScreenBeforeDelete = state.currentScreen;
        try {
          await dbUtils.deleteChat(id);
          console.log("チャット削除:", id);
          if (isDeletingCurrent) {
            console.log("表示中のチャットが削除されたため、内部状態を新規チャットにリセット。");
            this.startNewChat();
          }
          if (currentScreenBeforeDelete === "history") {
            console.log("履歴画面での操作のため、リストUIを更新します。");
            await uiUtils.renderHistoryList();
            const listIsEmpty = elements.historyList.querySelectorAll(".history-item:not(.js-history-item-template)").length === 0;
            if (listIsEmpty) {
              console.log("履歴リストが空になりました。");
              if (!isDeletingCurrent) {
                this.startNewChat();
              }
            }
          }
        } catch (error) {
          await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
          uiUtils.setSendingState(false);
        }
      }
    },
    // 履歴アイテムのタイトルを編集
    async editHistoryTitle(chatId, titleElement) {
      const currentTitle = titleElement.textContent;
      const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle);
      const trimmedTitle = newTitle !== null ? newTitle.trim() : "";
      if (newTitle !== "" && trimmedTitle !== "" && trimmedTitle !== currentTitle) {
        const finalTitle = trimmedTitle.substring(0, 100);
        try {
          await dbUtils.updateChatTitleDb(chatId, finalTitle);
          titleElement.textContent = finalTitle;
          titleElement.title = finalTitle;
          const dateElement = titleElement.closest(".history-item")?.querySelector(".updated-date");
          if (dateElement) dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;
          if (state.currentChatId === chatId) {
            uiUtils.updateChatTitle(finalTitle);
          }
        } catch (error) {
          await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
        }
      } else {
        console.log("タイトル編集キャンセルまたは変更なし");
      }
    },
    // --- 履歴インポートハンドラ ---
    async handleHistoryImport(file) {
      if (!file || !file.type.startsWith("text/plain")) {
        await uiUtils.showCustomAlert("テキストファイル (.txt) を選択してください。");
        return;
      }
      console.log("履歴インポート開始:", file.name);
      elements.progressMessage.textContent = "履歴ファイルを解析中...";
      elements.progressDialog.showModal();
      const reader = new FileReader();
      reader.onload = async (event) => {
        const textContent = event.target.result;
        if (!textContent) {
          elements.progressDialog.close();
          await uiUtils.showCustomAlert("ファイルの内容が空です。");
          return;
        }
        try {
          const { messages: importedMessages, systemPrompt: importedSystemPrompt, persistentMemory: importedMemory, summarizedContext: importedSummary, imageData: importedImageData } = this.parseImportedHistory(textContent);
          if (importedMessages.length === 0 && !importedSystemPrompt && (!importedMemory || Object.keys(importedMemory).length === 0)) {
            elements.progressDialog.close();
            await uiUtils.showCustomAlert("ファイルから有効なメッセージ、システムプロンプト、またはメタデータを読み込めませんでした。形式を確認してください。");
            return;
          }
          const imageIdMap = /* @__PURE__ */ new Map();
          if (importedImageData && Object.keys(importedImageData).length > 0) {
            elements.progressMessage.textContent = `画像を復元中... (0 / ${Object.keys(importedImageData).length})`;
            let restoredCount = 0;
            const totalImages = Object.keys(importedImageData).length;
            for (const oldId in importedImageData) {
              try {
                const { mimeType, data } = importedImageData[oldId];
                const blob = await this.base64ToBlob(data, mimeType);
                const newId = await this.saveImageBlob(blob);
                imageIdMap.set(oldId, newId);
                restoredCount++;
                elements.progressMessage.textContent = `画像を復元中... (${restoredCount} / ${totalImages})`;
              } catch (e) {
                console.error(`インポート中に画像(旧ID: ${oldId})の復元に失敗:`, e);
              }
            }
          }
          elements.progressMessage.textContent = "データベースに保存中...";
          importedMessages.forEach((msg) => {
            if (msg.imageIds && msg.imageIds.length > 0) {
              msg.imageIds = msg.imageIds.map((oldId) => imageIdMap.get(oldId) || oldId).filter(Boolean);
            }
          });
          let currentGroupId = null;
          let lastUserIndex = -1;
          for (let i = 0; i < importedMessages.length; i++) {
            const msg = importedMessages[i];
            if (msg.role === "user") {
              lastUserIndex = i;
              currentGroupId = null;
            } else if (msg.role === "model" && msg.isCascaded) {
              if (currentGroupId === null && lastUserIndex !== -1) {
                currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
              }
              if (currentGroupId) {
                msg.siblingGroupId = currentGroupId;
              }
            } else {
              currentGroupId = null;
            }
          }
          const groupIds = new Set(importedMessages.filter((m) => m.siblingGroupId).map((m) => m.siblingGroupId));
          groupIds.forEach((gid) => {
            const siblings = importedMessages.filter((m) => m.siblingGroupId === gid);
            const selected = siblings.filter((m) => m.isSelected);
            if (selected.length === 0 && siblings.length > 0) {
              siblings[siblings.length - 1].isSelected = true;
            } else if (selected.length > 1) {
              selected.slice(0, -1).forEach((m) => m.isSelected = false);
            }
          });
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          const newTitle = IMPORT_PREFIX + (fileNameWithoutExt || `Imported_${Date.now()}`);
          const newChatData = {
            messages: importedMessages,
            systemPrompt: importedSystemPrompt || "",
            persistentMemory: importedMemory || {},
            summarizedContext: importedSummary || null,
            updatedAt: Date.now(),
            createdAt: Date.now(),
            title: newTitle.substring(0, 100)
          };
          const newChatId = await new Promise((resolve, reject) => {
            const store = dbUtils._getStore(CHATS_STORE, "readwrite");
            const request = store.add(newChatData);
            request.onsuccess = (event2) => resolve(event2.target.result);
            request.onerror = (event2) => reject(event2.target.error);
          });
          this.markAsDirtyAndSchedulePush(true);
          console.log("履歴インポート成功:", newChatId);
          elements.progressDialog.close();
          await uiUtils.showCustomAlert(`履歴「${newChatData.title}」をインポートしました。`);
          uiUtils.renderHistoryList();
        } catch (error) {
          console.error("履歴インポート処理エラー:", error);
          elements.progressDialog.close();
          await uiUtils.showCustomAlert(`履歴のインポート中にエラーが発生しました: ${error.message}`);
        }
      };
      reader.onerror = async (event) => {
        console.error("ファイル読み込みエラー:", event.target.error);
        elements.progressDialog.close();
        await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
      };
      reader.readAsText(file);
    },
    parseImportedHistory(text) {
      const messages = [];
      let systemPrompt = "";
      let persistentMemory = {};
      let summarizedContext = null;
      const imageData = {};
      const attachmentData = {};
      let remainingText = text;
      const dataBlockRegex = /<\|#\|(metadata|summary|imagedata|attachmentdata)\|#\|>([\s\S]*?)<\|#\|\/\1\|#\|>\s*/g;
      let dataMatch;
      while ((dataMatch = dataBlockRegex.exec(text)) !== null) {
        const blockType = dataMatch[1];
        const blockContent = dataMatch[2].trim();
        try {
          const jsonData = JSON.parse(blockContent);
          switch (blockType) {
            case "metadata":
              persistentMemory = jsonData;
              break;
            case "summary":
              summarizedContext = jsonData;
              break;
            case "imagedata":
              Object.assign(imageData, jsonData);
              break;
            case "attachmentdata":
              Object.assign(attachmentData, jsonData);
              break;
          }
        } catch (e) {
          console.error(`インポートされた ${blockType} のJSONパースに失敗:`, e);
        }
        remainingText = remainingText.replace(dataMatch[0], "");
      }
      const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
      let match;
      while ((match = blockRegex.exec(remainingText)) !== null) {
        const role = match[1];
        const attributesString = match[2].trim();
        const content = match[3].trim();
        if (role === "system" && content) {
          systemPrompt = content;
        } else if (role === "user" || role === "model") {
          const messageData = {
            role,
            content,
            timestamp: Date.now(),
            attachments: []
          };
          const attributeRegex = /(\w+)="([^"]*)"|(\w+)/g;
          let attrMatch;
          while ((attrMatch = attributeRegex.exec(attributesString)) !== null) {
            if (attrMatch[1]) {
              const key = attrMatch[1];
              const value = attrMatch[2].replace(/&quot;/g, '"');
              if (key === "attachments") {
                const attachmentIds = value.split(",");
                messageData.attachments = attachmentIds.map((id) => {
                  const data = attachmentData[id];
                  if (data) {
                    return {
                      name: data.name,
                      mimeType: data.mimeType,
                      base64Data: data.data
                      // fileオブジェクトはインポート時には復元しない
                    };
                  }
                  return null;
                }).filter(Boolean);
              } else if (key === "imageIds") {
                messageData.imageIds = value.split(",");
              }
            } else if (attrMatch[3]) {
              messageData[attrMatch[3]] = true;
            }
          }
          messages.push(messageData);
        }
      }
      console.log(`インポートテキストから ${messages.length} 件のメッセージとシステムプロンプト(${systemPrompt ? "あり" : "なし"})、要約データ(${summarizedContext ? "あり" : "なし"})をパースしました。`);
      return { messages, systemPrompt, persistentMemory, summarizedContext, imageData };
    },
    async autoGenerateTitle() {
      const userMsgs = state.currentMessages.filter((m) => m.role === "user" && !m.isHidden);
      const modelMsgs = state.currentMessages.filter((m) => (m.role === "model" || m.role === "assistant") && !m.error && !m.isHidden);
      console.log(`[AutoTitle] 起動: userMsgs=${userMsgs.length}, modelMsgs=${modelMsgs.length}, chatId=${state.currentChatId}, provider=${state.settings.apiProvider}`);
      if (userMsgs.length !== 1 || modelMsgs.length < 1) {
        console.log("[AutoTitle] 条件不一致でスキップ");
        return;
      }
      if (!state.currentChatId) {
        console.log("[AutoTitle] currentChatId なしでスキップ");
        return;
      }
      const provider = state.settings.apiProvider || "gemini";
      const firstUserContent = (typeof userMsgs[0].content === "string" ? userMsgs[0].content : JSON.stringify(userMsgs[0].content)).substring(0, 300);
      const firstModelContent = (typeof modelMsgs[0].content === "string" ? modelMsgs[0].content : "").substring(0, 300);
      const titlePrompt = `以下の会話の内容を端的に表すタイトルを20文字以内で作成してください。タイトルのみを出力してください（説明・引用符不要）。

ユーザー: ${firstUserContent}
AI: ${firstModelContent}`;
      try {
        let title = null;
        if (provider === "gemini") {
          const apiKey = state.settings.apiKey;
          if (!apiKey) return;
          const endpoint = `${GEMINI_API_BASE_URL}gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: titlePrompt }] }],
              generationConfig: { maxOutputTokens: 30, temperature: 0.3 },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            title = data.candidates?.[0]?.content?.parts?.find((p) => p.text && p.thought !== true)?.text?.trim();
          }
        } else if (provider === "anthropic") {
          const apiKey = state.settings.anthropicApiKey;
          if (!apiKey) return;
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true"
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 30,
              messages: [{ role: "user", content: titlePrompt }]
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            title = data.content?.find((c) => c.type === "text")?.text?.trim();
          }
        } else {
          const apiKeyMap = {
            openai: state.settings.openaiApiKey,
            groq: state.settings.groqApiKey,
            deepseek: state.settings.deepseekApiKey,
            xai: state.settings.xaiApiKey,
            mistral: state.settings.mistralApiKey,
            openrouter: state.settings.openrouterApiKey,
            zai: state.settings.zaiApiKey || state.settings.apiKey,
            sakana: state.settings.sakanaApiKey
          };
          const baseUrlMap = {
            openai: "https://api.openai.com/v1/chat/completions",
            groq: GROQ_API_BASE_URL,
            deepseek: DEEPSEEK_API_BASE_URL,
            xai: XAI_API_BASE_URL,
            mistral: MISTRAL_API_BASE_URL,
            openrouter: OPENROUTER_API_BASE_URL,
            zai: ZAI_API_BASE_URL,
            sakana: SAKANA_API_BASE_URL
          };
          const apiKey = apiKeyMap[provider];
          const baseUrl = baseUrlMap[provider];
          if (!apiKey || !baseUrl) return;
          const titleModelMap = {
            deepseek: DEFAULT_DEEPSEEK_MODEL
            // 'deepseek-chat'（非リーズナー）
          };
          const titleModel = titleModelMap[provider] || state.settings.modelName;
          const resp = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: titleModel,
              max_tokens: 200,
              messages: [{ role: "user", content: titlePrompt }]
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            title = data.choices?.[0]?.message?.content?.trim();
          }
        }
        if (!title) return;
        title = title.replace(/^["「『\s]+|["」』\s]+$/g, "").substring(0, 25);
        if (!title) return;
        await dbUtils.updateChatTitleDb(state.currentChatId, title);
        uiUtils.updateChatTitle(title);
        uiUtils.renderHistoryList();
        console.log(`[AutoTitle] タイトル生成: "${title}"`);
      } catch (e) {
        console.warn("[AutoTitle] タイトル自動生成失敗:", e.message || e);
      }
    }
  };

  // src/api.js
  function extractSystemText(systemInstruction) {
    if (!systemInstruction) return null;
    if (typeof systemInstruction === "string") return systemInstruction;
    if (systemInstruction.parts) return systemInstruction.parts.map((p) => p.text || "").join("");
    return null;
  }
  __name(extractSystemText, "extractSystemText");
  var apiUtils = {
    // Gemini形式からOpenAI形式への変換
    convertGeminiToOpenAIFormat(messagesForApi) {
      const openAIMessages = [];
      for (const geminiMsg of messagesForApi) {
        const role = geminiMsg.role === "model" ? "assistant" : geminiMsg.role === "tool" ? "tool" : "user";
        const parts = geminiMsg.parts || [];
        if (role === "tool") {
          for (const part of parts) {
            if (part.functionResponse) {
              const toolCallId = part.functionResponse._toolCallId || part.functionResponse.name;
              openAIMessages.push({
                role: "tool",
                tool_call_id: toolCallId,
                content: typeof part.functionResponse.response === "string" ? part.functionResponse.response : JSON.stringify(part.functionResponse.response)
              });
            }
          }
        } else {
          const contentParts = [];
          const toolCalls = [];
          for (const part of parts) {
            if (part.text) {
              contentParts.push({ type: "text", text: part.text });
            } else if (part.inlineData) {
              const mimeType = part.inlineData.mimeType || "";
              const rawData = (part.inlineData.data || "").replace(/^data:[^;]+;base64,/, "");
              if (mimeType.startsWith("image/")) {
                contentParts.push({
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${rawData}` }
                });
              } else {
                let decoded;
                try {
                  decoded = decodeURIComponent(escape(atob(rawData)));
                } catch {
                  decoded = "[添付ファイルを読み込めませんでした]";
                }
                contentParts.push({ type: "text", text: decoded });
              }
            } else if (part.functionCall) {
              const toolCallId = part.functionCall._toolCallId || `call_${Date.now()}_${Math.random()}`;
              toolCalls.push({
                id: toolCallId,
                type: "function",
                function: {
                  name: part.functionCall.name,
                  arguments: typeof part.functionCall.args === "string" ? part.functionCall.args : JSON.stringify(part.functionCall.args || {})
                }
              });
            }
          }
          const message = { role };
          if (contentParts.length > 0) {
            if (contentParts.length === 1 && contentParts[0].type === "text") {
              message.content = contentParts[0].text;
            } else {
              message.content = contentParts.map((part) => {
                if (part.type === "text") {
                  return { type: "text", text: part.text };
                } else if (part.type === "image_url") {
                  return part;
                }
                return part;
              });
            }
          } else if (toolCalls.length > 0) {
            message.content = "";
          }
          if (toolCalls.length > 0) {
            message.tool_calls = toolCalls;
          }
          if (message.content !== void 0 || message.tool_calls) {
            openAIMessages.push(message);
          }
        }
      }
      const toolMessages = openAIMessages.filter((m) => m.role === "tool");
      const assistantMessagesWithTools = openAIMessages.filter((m) => m.role === "assistant" && m.tool_calls);
      if (toolMessages.length > 0 || assistantMessagesWithTools.length > 0) {
        console.log("[Z.ai Debug] 変換後のメッセージ情報:");
        if (assistantMessagesWithTools.length > 0) {
          console.log(`  - assistant with tool_calls: ${assistantMessagesWithTools.length}件`);
          const lastAssistant = assistantMessagesWithTools[assistantMessagesWithTools.length - 1];
          if (lastAssistant && lastAssistant.tool_calls) {
            console.log(`  - 最後のassistantのtool_call IDs:`, JSON.stringify(lastAssistant.tool_calls.map((tc) => tc.id)));
          }
        }
        if (toolMessages.length > 0) {
          console.log(`  - tool messages: ${toolMessages.length}件`);
          const recentToolIds = toolMessages.slice(-5).map((m) => m.tool_call_id);
          console.log(`  - 最近のtool_call_ids:`, JSON.stringify(recentToolIds));
        }
        if (assistantMessagesWithTools.length > 0 && toolMessages.length > 0) {
          const lastAssistant = assistantMessagesWithTools[assistantMessagesWithTools.length - 1];
          const expectedIds = lastAssistant.tool_calls?.map((tc) => tc.id) || [];
          const actualIds = toolMessages.slice(-expectedIds.length).map((tm) => tm.tool_call_id);
          const matched = expectedIds.every((id, i) => id === actualIds[i]);
          console.log(`  - ID一致チェック: ${matched ? "✓ 一致" : "✗ 不一致"}`);
          if (!matched) {
            console.warn(`  - 期待されるIDs: ${JSON.stringify(expectedIds)}`);
            console.warn(`  - 実際のIDs: ${JSON.stringify(actualIds)}`);
          }
        }
      }
      return openAIMessages;
    },
    // OpenAI形式からGemini形式への変換（レスポンス用）
    convertOpenAIToGeminiFormat(openAIResponse) {
      const candidates = [];
      if (openAIResponse.choices && openAIResponse.choices.length > 0) {
        for (const choice of openAIResponse.choices) {
          const parts = [];
          const message = choice.message;
          if (message.reasoning_content) {
            parts.push({ text: message.reasoning_content, thought: true });
          }
          if (message.content) {
            if (typeof message.content === "string") {
              const thinkMatch = message.content.match(/^<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/);
              if (thinkMatch) {
                if (thinkMatch[1].trim()) parts.push({ text: thinkMatch[1].trim(), thought: true });
                if (thinkMatch[2].trim()) parts.push({ text: thinkMatch[2].trim() });
              } else {
                parts.push({ text: message.content });
              }
            } else if (Array.isArray(message.content)) {
              for (const contentItem of message.content) {
                if (contentItem.type === "text") {
                  parts.push({ text: contentItem.text });
                } else if (contentItem.type === "image_url") {
                }
              }
            }
          }
          if (message.tool_calls && message.tool_calls.length > 0) {
            for (const toolCall of message.tool_calls) {
              const callArgs = toolCall?.function?.arguments;
              const parsedArgs = this._parseToolArguments(callArgs);
              parts.push({
                functionCall: {
                  name: toolCall.function.name,
                  args: parsedArgs,
                  _toolCallId: toolCall.id
                  // OpenAI互換APIのtool_call_idを保存
                }
              });
            }
          }
          if (parts.length > 0) {
            candidates.push({
              content: { parts },
              finishReason: this.mapFinishReason(choice.finish_reason),
              index: choice.index
            });
          }
        }
      }
      const usageMetadata = openAIResponse.usage ? {
        promptTokenCount: openAIResponse.usage.prompt_tokens,
        candidatesTokenCount: openAIResponse.usage.completion_tokens,
        totalTokenCount: openAIResponse.usage.total_tokens,
        // DeepSeek はキャッシュヒット入力トークンを返すので、コスト計算の精度向上に取り込む
        ...openAIResponse.usage.prompt_cache_hit_tokens != null ? { cacheReadInputTokens: openAIResponse.usage.prompt_cache_hit_tokens } : {}
      } : void 0;
      return {
        candidates,
        usageMetadata
      };
    },
    // OpenAIのfinish_reasonをGeminiのfinishReasonにマッピング
    mapFinishReason(openAIFinishReason) {
      const mapping = {
        "stop": "STOP",
        "length": "MAX_TOKENS",
        "tool_calls": "STOP",
        "content_filter": "SAFETY",
        "function_call": "STOP"
      };
      return mapping[openAIFinishReason] || "STOP";
    },
    /**
     * OpenAI形式のtool argumentsを安全にオブジェクトへ変換する
     * - 文字列(JSON)形式
     * - 文字列だが各値がクォートされていない簡易オブジェクト形式
     * - 既にオブジェクト
     * に対応する。
     * 解析に失敗した場合は { raw: ... } を返す。
     */
    _parseToolArguments(callArgs) {
      if (!callArgs) {
        return {};
      }
      if (typeof callArgs === "object") {
        return callArgs;
      }
      if (typeof callArgs !== "string") {
        return {};
      }
      const trimmed = callArgs.trim();
      if (!trimmed) {
        return {};
      }
      try {
        return JSON.parse(trimmed);
      } catch (firstError) {
        try {
          const normalized = trimmed.replace(/:\s*([^"{[\],}]+)(?=\s*[},])/g, (_match, value) => {
            const v = value.trim();
            if (!v) return ': ""';
            const lower = v.toLowerCase();
            if (lower === "true" || lower === "false" || lower === "null") {
              return `: ${lower}`;
            }
            if (/^-?\d+(\.\d+)?$/.test(v)) {
              return `: ${v}`;
            }
            const escaped = v.replace(/"/g, '\\"');
            return `: "${escaped}"`;
          });
          return JSON.parse(normalized);
        } catch (secondError) {
          console.warn("convertOpenAIToGeminiFormat: argumentsの解析に失敗しました。生文字列を保持します。", secondError);
          return { raw: trimmed };
        }
      }
    },
    // Gemini形式からBedrock Converse形式への変換
    convertGeminiToConverseFormat(messagesForApi) {
      const converseMessages = [];
      let pendingToolResults = [];
      for (let i = 0; i < messagesForApi.length; i++) {
        const geminiMsg = messagesForApi[i];
        let role = geminiMsg.role === "model" ? "assistant" : geminiMsg.role;
        const content = [];
        let hasFunctionResponse = false;
        if (geminiMsg.parts) {
          for (const part of geminiMsg.parts) {
            if (part.text) {
              content.push({ text: part.text });
            } else if (part.inlineData) {
              const base64Data = part.inlineData.data;
              const format = part.inlineData.mimeType.split("/")[1];
              content.push({
                image: {
                  format,
                  source: {
                    bytes: Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
                  }
                }
              });
            } else if (part.functionCall) {
              content.push({
                toolUse: {
                  toolUseId: part.functionCall._toolCallId || `tool_${Date.now()}_${Math.random()}`,
                  name: part.functionCall.name,
                  input: part.functionCall.args || {}
                }
              });
            } else if (part.functionResponse) {
              hasFunctionResponse = true;
              const responseContent = typeof part.functionResponse.response === "string" ? part.functionResponse.response : JSON.stringify(part.functionResponse.response);
              const toolUseId = part.functionResponse._toolCallId || part.functionResponse.name;
              content.push({
                toolResult: {
                  toolUseId,
                  content: [{ text: responseContent }]
                }
              });
            }
          }
        }
        if (geminiMsg.role === "tool" || hasFunctionResponse) {
          pendingToolResults.push(...content);
          const nextMsg = messagesForApi[i + 1];
          const isLastMessage = i === messagesForApi.length - 1;
          const nextIsNotTool = !nextMsg || nextMsg.role !== "tool" && !nextMsg.parts?.some((p) => p.functionResponse);
          if (isLastMessage || nextIsNotTool) {
            if (pendingToolResults.length > 0) {
              converseMessages.push({
                role: "user",
                content: pendingToolResults
              });
              pendingToolResults = [];
            }
          }
        } else {
          if (content.length > 0) {
            converseMessages.push({ role, content });
          }
        }
      }
      return converseMessages;
    },
    // Bedrock Converse形式からGemini形式への変換
    convertConverseToGeminiFormat(converseResponse) {
      const parts = [];
      if (converseResponse.output && converseResponse.output.message) {
        const message = converseResponse.output.message;
        for (const contentItem of message.content || []) {
          if (contentItem.text) {
            parts.push({ text: contentItem.text });
          } else if (contentItem.toolUse) {
            parts.push({
              functionCall: {
                name: contentItem.toolUse.name,
                args: contentItem.toolUse.input || {},
                _toolCallId: contentItem.toolUse.toolUseId
              }
            });
          }
        }
      }
      let finishReason = "STOP";
      if (converseResponse.stopReason) {
        const reasonMap = {
          "end_turn": "STOP",
          "tool_use": "STOP",
          "max_tokens": "MAX_TOKENS",
          "stop_sequence": "STOP",
          "content_filtered": "SAFETY"
        };
        finishReason = reasonMap[converseResponse.stopReason] || "STOP";
      }
      return {
        candidates: [{
          content: {
            parts,
            role: "model"
          },
          finishReason
        }],
        usageMetadata: {
          promptTokenCount: converseResponse.usage?.inputTokens || 0,
          candidatesTokenCount: converseResponse.usage?.outputTokens || 0,
          totalTokenCount: (converseResponse.usage?.inputTokens || 0) + (converseResponse.usage?.outputTokens || 0)
        }
      };
    },
    // Gemini形式のFunction DeclarationsをBedrock形式に変換
    convertGeminiToolsToBedrock(geminiTools) {
      const normalizeJsonSchema = /* @__PURE__ */ __name((schema) => {
        if (!schema || typeof schema !== "object") {
          return schema;
        }
        const normalized = Array.isArray(schema) ? [] : {};
        for (const key in schema) {
          if (!schema.hasOwnProperty(key)) continue;
          let value = schema[key];
          if (key === "type" && typeof value === "string") {
            value = value.toLowerCase();
          } else if (typeof value === "object" && value !== null) {
            value = normalizeJsonSchema(value);
          }
          normalized[key] = value;
        }
        return normalized;
      }, "normalizeJsonSchema");
      const bedrockTools = [];
      for (const geminiTool of geminiTools) {
        if (geminiTool.function_declarations && Array.isArray(geminiTool.function_declarations)) {
          for (const funcDecl of geminiTool.function_declarations) {
            const normalizedParameters = normalizeJsonSchema(funcDecl.parameters || {});
            bedrockTools.push({
              toolSpec: {
                name: funcDecl.name,
                description: funcDecl.description || "",
                inputSchema: {
                  json: normalizedParameters
                }
              }
            });
          }
        }
      }
      return bedrockTools;
    },
    // Gemini APIを呼び出す
    async callGeminiApi(messagesForApi, generationConfig, systemInstruction, tools = null, forceCalling = false, signal = null) {
      console.log(`[Debug] callGeminiApi: 現在の設定値を確認します。`, {
        forceFunctionCalling: state.settings.forceFunctionCalling,
        geminiEnableFunctionCalling: state.settings.geminiEnableFunctionCalling,
        isForcedNow: forceCalling
      });
      const apiKey = state.settings.apiKey;
      if (!apiKey) {
        throw new Error("Gemini APIキーが設定されていません。");
      }
      if (!signal) {
        state.abortController = new AbortController();
        signal = state.abortController.signal;
      }
      const model = state.settings.modelName || DEFAULT_MODEL;
      if (model === "gemini-2.5-pro") {
        await appLogic._updateApiUsageCount(state.activeProfileId);
      }
      const isImageGenModel = model === "gemini-2.5-flash-image-preview" || model.includes("image-generation") || model.includes("imagen");
      const endpointMethod = "generateContent?";
      const endpoint = `${GEMINI_API_BASE_URL}${model}:${endpointMethod}key=${apiKey}`;
      const finalGenerationConfig = { ...generationConfig };
      if (isImageGenModel) {
        finalGenerationConfig.responseModalities = ["IMAGE", "TEXT"];
        delete finalGenerationConfig.thinkingConfig;
        delete finalGenerationConfig.maxOutputTokens;
        delete finalGenerationConfig.topK;
        delete finalGenerationConfig.topP;
        delete finalGenerationConfig.temperature;
      } else {
        if (state.settings.thinkingBudget > 0 || state.settings.includeThoughts) {
          generationConfig.thinkingConfig = {};
          if (state.settings.thinkingBudget > 0) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
          if (state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
        }
      }
      const requestBody = {
        contents: messagesForApi,
        ...Object.keys(finalGenerationConfig).length > 0 && { generationConfig: finalGenerationConfig },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };
      if (isImageGenModel) {
        requestBody.safetySettings = [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ];
      } else {
        if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0 && systemInstruction.parts[0].text) {
          const { _staticText, _dynamicText, ...cleanSystemInstruction } = systemInstruction;
          requestBody.systemInstruction = cleanSystemInstruction;
        }
        let finalTools = [];
        if (state.settings.geminiEnableFunctionCalling) {
          finalTools = window.functionDeclarations || [];
          console.log("Function Calling を有効にしてAPIを呼び出します。");
        } else if (state.settings.geminiEnableGrounding) {
          finalTools.push({ "google_search": {} });
          console.log("グラウンディング (Google Search) を有効にしてAPIを呼び出します。");
        }
        if (finalTools.length > 0) {
          requestBody.tools = finalTools;
        }
        if (forceCalling && state.settings.geminiEnableFunctionCalling) {
          requestBody.toolConfig = {
            functionCallingConfig: {
              mode: "ANY"
            }
          };
          console.log("Function Calling を強制モード (ANY) で実行します。");
        }
      }
      console.log("Geminiへの送信データ:", JSON.stringify(requestBody, (key, value) => {
        if (key === "data" && typeof value === "string" && value.length > 100) {
          return value.substring(0, 50) + "...[省略]..." + value.substring(value.length - 20);
        }
        return value;
      }, 2));
      console.log("ターゲットエンドポイント:", endpoint);
      try {
        const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        console.log(`[API_DEBUG ${timestamp}] Sending fetch request to Gemini API...`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(requestBody),
          signal
        });
        const receivedTimestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        console.log(`[API_DEBUG ${receivedTimestamp}] Received response from Gemini API. Status: ${response.status}`);
        if (!response.ok) {
          let errorMsg = `APIエラー (${response.status}): ${response.statusText}`;
          let errorData = null;
          try {
            errorData = await response.json();
            console.error("APIエラーレスポンスボディ:", errorData);
            if (errorData.error && errorData.error.message) {
              errorMsg = `APIエラー (${response.status}): ${errorData.error.message}`;
            }
          } catch (e) {
            console.error("APIエラーレスポンスボディのパース失敗:", e);
          }
          const error = new Error(errorMsg);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }
        return response;
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("リクエストがキャンセルされました。");
        } else {
          throw error;
        }
      }
    },
    /**
     * テキストを日本語に翻訳する関数
     * @param {string} textToTranslate - 翻訳対象の英語テキスト
     * @param {string} translationModelName - 翻訳に使用するモデル名
     * @returns {Promise<string>} 翻訳された日本語テキスト。失敗した場合は元の英語テキストを返す。
     */
    async translateText(textToTranslate, translationModelName) {
      if (!textToTranslate || textToTranslate.trim() === "") {
        return textToTranslate;
      }
      const japaneseChars = textToTranslate.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g) || [];
      const japaneseRatio = japaneseChars.length / textToTranslate.length;
      if (japaneseRatio > 0.5) {
        console.log(`翻訳スキップ: 日本語の文字が${Math.round(japaneseRatio * 100)}%含まれているため、翻訳済みと判断しました。`);
        return textToTranslate;
      }
      console.log("--- 思考プロセスの翻訳処理開始 ---");
      const modelToUse = translationModelName || "gemini-2.5-flash-lite";
      const isDeepSeek = modelToUse.startsWith("deepseek-");
      const translationSystemPrompt = "You are a professional translator. Translate the given English text into natural Japanese. Do not add any extra comments or explanations. Just output the translated Japanese text.";
      let endpoint, requestBody, fetchHeaders;
      if (isDeepSeek) {
        const deepseekApiKey = state.settings.deepseekApiKey;
        if (!deepseekApiKey) {
          console.warn("翻訳スキップ: DeepSeek APIキーが設定されていません。");
          return textToTranslate;
        }
        endpoint = DEEPSEEK_API_BASE_URL;
        fetchHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${deepseekApiKey}` };
        requestBody = {
          model: modelToUse,
          messages: [
            { role: "system", content: translationSystemPrompt },
            { role: "user", content: textToTranslate }
          ],
          temperature: 0.1
        };
      } else {
        const apiKey = state.settings.apiKey;
        if (!apiKey) {
          console.warn("翻訳スキップ: APIキーが設定されていません。");
          return textToTranslate;
        }
        endpoint = `${GEMINI_API_BASE_URL}${modelToUse}:generateContent`;
        fetchHeaders = { "Content-Type": "application/json", "x-goog-api-key": apiKey };
        requestBody = {
          contents: [{ role: "user", parts: [{ text: textToTranslate }] }],
          systemInstruction: { parts: [{ text: translationSystemPrompt }] },
          generationConfig: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };
      }
      if (state.settings.dummyEnabled && state.settings.applyDummyToTranslate && state.settings.dummyUser) {
        requestBody.contents.push({
          role: "user",
          parts: [{ text: state.settings.dummyUser }]
        });
        console.log("翻訳リクエストにダミーUserプロンプトを適用しました。");
      }
      let lastError = null;
      const maxTranslationRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;
      for (let attempt = 0; attempt <= maxTranslationRetries; attempt++) {
        try {
          if (state.abortController?.signal.aborted) {
            throw new Error("リクエストがキャンセルされました。");
          }
          if (attempt > 0) {
            let delay;
            if (state.settings.useFixedRetryDelay) {
              delay = state.settings.fixedRetryDelaySeconds * 1e3;
            } else {
              const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
              const maxDelay = state.settings.maxBackoffDelaySeconds * 1e3;
              delay = Math.min(exponentialDelay, maxDelay);
            }
            uiUtils.setLoadingIndicatorText(`翻訳エラー 再試行(${attempt}回目)... ${Math.round(delay / 1e3)}秒待機`);
            console.log(`翻訳APIリトライ ${attempt}: ${delay}ms待機...`);
            await interruptibleSleep(delay, state.abortController.signal);
          }
          if (attempt > 0) {
            uiUtils.setLoadingIndicatorText("思考プロセスの翻訳を再試行中...");
          } else {
            uiUtils.setLoadingIndicatorText("思考プロセスを翻訳中...");
          }
          const timeoutController = new AbortController();
          const timeoutId = setTimeout(() => timeoutController.abort(), 15e3);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify(requestBody),
            signal: timeoutController.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            let errorBody = await response.text();
            try {
              errorBody = JSON.parse(errorBody);
            } catch (e) {
            }
            console.error(`翻訳APIエラー (${response.status})`, errorBody);
            const error = new Error(`翻訳APIエラー (${response.status})`);
            error.status = response.status;
            throw error;
          }
          const responseData = await response.json();
          const translatedText = isDeepSeek ? responseData.choices?.[0]?.message?.content : responseData.candidates?.[0]?.content?.parts?.find((p) => !p.thought && p.text)?.text;
          if (translatedText) {
            console.log("--- 翻訳処理成功 ---");
            return translatedText;
          } else {
            console.warn("翻訳APIの応答形式が不正、またはコンテンツが空です。", responseData);
            if (responseData.promptFeedback) {
              console.warn("翻訳がブロックされた可能性があります:", responseData.promptFeedback);
            }
            throw new Error("翻訳APIの応答形式が不正です。");
          }
        } catch (error) {
          lastError = error;
          if (error.name === "AbortError" || error.name === "TimeoutError") {
            if (state.abortController?.signal.aborted) {
              break;
            }
          }
          if (error.status && error.status >= 400 && error.status < 500) {
            console.error(`リトライ不可の翻訳エラー (ステータス: ${error.status})。`);
            break;
          }
          console.warn(`翻訳API呼び出し試行 ${attempt + 1} が失敗。`, error);
        }
      }
      console.error("思考プロセスの翻訳中にエラーが発生しました。原文を返します。", lastError);
      return textToTranslate;
    },
    // OpenAI互換プロバイダー（Function Calling対応）の共通実装。
    // Z.ai / OpenRouter の差分は cfg で吸収する（wire は変更しない）。
    async _callOpenAICompatibleWithTools(cfg, messagesForApi, generationConfig, systemInstruction, forceCalling = false, signal = null) {
      console.log(`[Debug] _callOpenAICompatibleWithTools: ${cfg.label} APIを呼び出します。`);
      const apiKey = cfg.getApiKey();
      if (!apiKey) {
        throw new Error(cfg.missingKeyMessage);
      }
      if (!signal) {
        state.abortController = new AbortController();
        signal = state.abortController.signal;
      }
      const model = state.settings.modelName || cfg.defaultModel;
      const openAIMessages = this.convertGeminiToOpenAIFormat(messagesForApi);
      if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0) {
        const systemText = systemInstruction.parts[0].text;
        if (systemText) {
          openAIMessages.unshift({
            role: "system",
            content: systemText
          });
        }
      }
      const requestBody = {
        model,
        messages: openAIMessages
      };
      if (generationConfig) {
        if (generationConfig.temperature !== void 0) {
          requestBody.temperature = generationConfig.temperature;
        }
        if (generationConfig.maxOutputTokens !== void 0) {
          requestBody.max_tokens = generationConfig.maxOutputTokens;
        }
        if (generationConfig.topP !== void 0) {
          requestBody.top_p = generationConfig.topP;
        }
      }
      if (state.settings.geminiEnableFunctionCalling && window.functionDeclarations) {
        const openAITools = [];
        for (const geminiTool of window.functionDeclarations) {
          if (geminiTool.function_declarations && Array.isArray(geminiTool.function_declarations)) {
            for (const funcDecl of geminiTool.function_declarations) {
              openAITools.push({
                type: "function",
                function: {
                  name: funcDecl.name,
                  description: funcDecl.description || "",
                  parameters: funcDecl.parameters || {}
                }
              });
            }
          } else if (geminiTool.google_search) {
            console.warn(`${cfg.label} APIではGoogle Searchはサポートされていません。スキップします。`);
          }
        }
        if (openAITools.length > 0) {
          requestBody.tools = openAITools;
          if (forceCalling) {
            requestBody.tool_choice = "required";
          } else {
            requestBody.tool_choice = "auto";
          }
          console.log(`${cfg.label} APIに ${openAITools.length} 個のFunction Callingツールを設定しました。`);
        }
      }
      console.log(`${cfg.label}への送信データ:`, JSON.stringify(requestBody, (key, value) => {
        if (key === "data" && typeof value === "string" && value.length > 100) {
          return value.substring(0, 50) + "...[省略]..." + value.substring(value.length - 20);
        }
        return value;
      }, 2));
      if (requestBody.messages && requestBody.messages.length > 0) {
        const recentMessages = requestBody.messages.slice(-6);
        console.log(`[${cfg.label} Debug] 送信する最近のメッセージ構造:`);
        recentMessages.forEach((msg, idx) => {
          const info = { role: msg.role };
          if (msg.tool_calls) {
            info.tool_calls = msg.tool_calls.map((tc) => ({ id: tc.id, name: tc.function?.name }));
          }
          if (msg.tool_call_id) {
            info.tool_call_id = msg.tool_call_id;
          }
          if ("content" in msg) {
            if (typeof msg.content === "string") {
              if (msg.content === "") {
                info.content = '""';
              } else {
                info.content_preview = msg.content.substring(0, 50) + "...";
              }
            } else {
              info.content_type = typeof msg.content;
            }
          } else {
            info.no_content_field = true;
          }
          console.log(`  [${idx}]`, JSON.stringify(info));
        });
      }
      console.log("ターゲットエンドポイント:", cfg.baseUrl);
      try {
        const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        console.log(`[API_DEBUG ${timestamp}] Sending fetch request to ${cfg.label} API...`);
        const response = await fetch(cfg.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            ...cfg.extraHeaders()
          },
          body: JSON.stringify(requestBody),
          signal
        });
        const receivedTimestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        console.log(`[API_DEBUG ${receivedTimestamp}] Received response from ${cfg.label} API. Status: ${response.status}`);
        if (!response.ok) {
          let errorMsg = `APIエラー (${response.status}): ${response.statusText}`;
          let errorData = null;
          try {
            errorData = await response.json();
            console.error("APIエラーレスポンスボディ:", errorData);
            if (cfg.verboseError && errorData.error) {
              console.error(`[${cfg.label}] エラー詳細:`, JSON.stringify(errorData.error, null, 2));
              if (errorData.error.metadata) {
                console.error(`[${cfg.label}] メタデータ:`, errorData.error.metadata);
              }
              if (errorData.error.code) {
                console.error(`[${cfg.label}] エラーコード:`, errorData.error.code);
              }
            }
            if (errorData.error && errorData.error.message) {
              errorMsg = `APIエラー (${response.status}): ${errorData.error.message}`;
              if (cfg.verboseError && errorData.error.code) {
                errorMsg += ` (code: ${errorData.error.code})`;
              }
            } else if (errorData.message) {
              errorMsg = `APIエラー (${response.status}): ${errorData.message}`;
            }
          } catch (e) {
            console.error("APIエラーレスポンスボディのパース失敗:", e);
          }
          const error = new Error(errorMsg);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }
        const openAIResponse = await response.json();
        if (openAIResponse.choices && openAIResponse.choices[0]) {
          const choice = openAIResponse.choices[0];
          console.log(`[${cfg.label} Debug] APIレスポンス情報:`);
          console.log(`  - finish_reason: ${choice.finish_reason}`);
          if (choice.message) {
            if (choice.message.tool_calls) {
              console.log(`  - tool_calls数: ${choice.message.tool_calls.length}`);
              choice.message.tool_calls.forEach((tc, idx) => {
                console.log(`    [${idx}] id: ${tc.id}, name: ${tc.function?.name}`);
              });
            }
            if (choice.message.content) {
              console.log(`  - content: ${choice.message.content.substring(0, 50)}...`);
            }
          }
        }
        const geminiFormatResponse = this.convertOpenAIToGeminiFormat(openAIResponse);
        return {
          ok: true,
          status: response.status,
          json: /* @__PURE__ */ __name(async () => geminiFormatResponse, "json")
        };
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("リクエストがキャンセルされました。");
        } else {
          throw error;
        }
      }
    },
    // Amazon Bedrock APIを呼び出す
    async callBedrockApi(messagesForApi, generationConfig, systemInstruction, tools = null, forceCalling = false, signal = null) {
      console.log(`[Debug] callBedrockApi: Amazon Bedrock APIを呼び出します。`);
      const accessKey = state.settings.bedrockAccessKey;
      const secretKey = state.settings.bedrockSecretKey;
      const region = state.settings.bedrockRegion || DEFAULT_BEDROCK_REGION;
      console.log(`[Bedrock Debug] Access Key存在: ${!!accessKey}, Secret Key存在: ${!!secretKey}, Region: ${region}`);
      console.log(`[Bedrock Debug] state.settings:`, {
        bedrockAccessKey: accessKey ? `${accessKey.substring(0, 8)}...` : "なし",
        bedrockSecretKey: secretKey ? "設定済み" : "なし",
        bedrockRegion: region
      });
      if (!accessKey || !secretKey) {
        console.error("[Bedrock Debug] 認証情報が不足しています。elements確認:", {
          bedrockAccessKeyInput: elements.bedrockAccessKeyInput,
          bedrockSecretKeyInput: elements.bedrockSecretKeyInput,
          bedrockAccessKeyValue: elements.bedrockAccessKeyInput?.value,
          bedrockSecretKeyValue: elements.bedrockSecretKeyInput ? "存在する" : "なし"
        });
        throw new Error("Bedrock認証情報（Access KeyまたはSecret Key）が設定されていません。");
      }
      if (!window.BedrockRuntimeClient || !window.ConverseCommand) {
        throw new Error("AWS Bedrock SDK が読み込まれていません。ページを再読み込みしてください。");
      }
      if (!signal) {
        state.abortController = new AbortController();
        signal = state.abortController.signal;
      }
      const modelId = state.settings.modelName || DEFAULT_BEDROCK_MODEL;
      try {
        const client = new window.BedrockRuntimeClient({
          region,
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey
          }
        });
        const converseMessages = this.convertGeminiToConverseFormat(messagesForApi);
        console.log(`[Bedrock] 変換後のメッセージ数: ${converseMessages.length}`);
        converseMessages.forEach((msg, idx) => {
          const toolResults = msg.content?.filter((c) => c.toolResult) || [];
          if (toolResults.length > 0) {
            console.log(`[Bedrock] メッセージ${idx} (role: ${msg.role}): ${toolResults.length}個のtoolResultを含む`);
          }
        });
        let systemPrompts = [];
        if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0) {
          const systemText = systemInstruction.parts[0].text;
          if (systemText) {
            systemPrompts.push({ text: systemText });
          }
        }
        const requestBody = {
          modelId,
          messages: converseMessages,
          inferenceConfig: {}
        };
        if (systemPrompts.length > 0) {
          requestBody.system = systemPrompts;
        }
        if (generationConfig.maxOutputTokens) {
          requestBody.inferenceConfig.maxTokens = generationConfig.maxOutputTokens;
        }
        const isClaudeSonnet45 = modelId.includes("claude-sonnet-4-5");
        if (generationConfig.temperature !== void 0 && generationConfig.temperature !== null) {
          requestBody.inferenceConfig.temperature = generationConfig.temperature;
        }
        if (!isClaudeSonnet45 && generationConfig.topP !== void 0 && generationConfig.topP !== null) {
          requestBody.inferenceConfig.topP = generationConfig.topP;
        } else if (isClaudeSonnet45 && generationConfig.topP !== void 0) {
          console.log("[Bedrock] Claude Sonnet 4.5では topP パラメータをスキップします（temperature と topP の同時指定不可のため）");
        }
        if (state.settings.geminiEnableFunctionCalling && window.functionDeclarations) {
          const bedrockTools = this.convertGeminiToolsToBedrock(window.functionDeclarations);
          if (bedrockTools.length > 0) {
            requestBody.toolConfig = {
              tools: bedrockTools
            };
            if (forceCalling) {
              requestBody.toolConfig.toolChoice = { any: {} };
            } else {
              requestBody.toolConfig.toolChoice = { auto: {} };
            }
            console.log(`Amazon Bedrock APIに ${bedrockTools.length} 個のFunction Callingツールを設定しました。`);
          }
        }
        console.log("Amazon Bedrockへの送信データ:", JSON.stringify(requestBody, (key, value) => {
          if (key === "bytes" && value instanceof Uint8Array) {
            return `[Uint8Array: ${value.length} bytes]`;
          }
          return value;
        }, 2));
        const command = new window.ConverseCommand(requestBody);
        const response = await client.send(command);
        console.log("Amazon Bedrockからのレスポンス:", response);
        const geminiFormatResponse = this.convertConverseToGeminiFormat(response);
        return {
          ok: true,
          status: 200,
          json: /* @__PURE__ */ __name(async () => geminiFormatResponse, "json")
        };
      } catch (error) {
        console.error("Amazon Bedrock API呼び出しエラー:", error);
        throw new Error(`Bedrock APIエラー: ${error.message}`);
      }
    },
    // OpenAI Chat Completions API（純正OpenAI）を呼び出す
    async callOpenAIApi(messages, config, systemInstruction, tools, forceCalling, signal) {
      const apiKey = state.settings.openaiApiKey;
      if (!apiKey) {
        const e = new Error("OpenAI APIキーが設定されていません。設定画面で追加してください。");
        e.status = 401;
        throw e;
      }
      const model = state.settings.modelName || "gpt-4o";
      const isReasoningModel = /^o\d/i.test(model);
      const requestBody = {
        model,
        messages: [],
        max_completion_tokens: config.maxOutputTokens ?? 4e3,
        stream: false
      };
      if (!isReasoningModel) {
        requestBody.temperature = config.temperature ?? 0.7;
        requestBody.top_p = config.topP ?? 1;
      }
      const systemText = extractSystemText(systemInstruction);
      if (systemText) requestBody.messages.push({ role: "system", content: systemText });
      this.convertGeminiToOpenAIFormat(messages).forEach((msg) => requestBody.messages.push(msg));
      if (tools && tools.length > 0) {
        const convertTypes = /* @__PURE__ */ __name((schema) => {
          if (!schema || typeof schema !== "object") return schema;
          if (Array.isArray(schema)) return schema.map(convertTypes);
          const result = {};
          for (const [key, val] of Object.entries(schema)) {
            if (key === "type" && typeof val === "string") {
              result[key] = val.toLowerCase();
            } else if (val && typeof val === "object") {
              result[key] = convertTypes(val);
            } else {
              result[key] = val;
            }
          }
          return result;
        }, "convertTypes");
        const openAITools = [];
        for (const toolGroup of tools) {
          for (const decl of toolGroup.function_declarations || []) {
            openAITools.push({
              type: "function",
              function: {
                name: decl.name,
                description: decl.description || "",
                parameters: convertTypes(decl.parameters) || { type: "object", properties: {} }
              }
            });
          }
        }
        if (openAITools.length > 0) {
          requestBody.tools = openAITools;
          if (forceCalling) requestBody.tool_choice = "required";
        }
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody),
        signal
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const e = new Error(`OpenAI APIエラー: ${err.error?.message || response.statusText}`);
        e.status = response.status;
        throw e;
      }
      const data = await response.json();
      const geminiFormat = this.convertOpenAIToGeminiFormat(data);
      return { ok: true, status: 200, json: /* @__PURE__ */ __name(async () => geminiFormat, "json") };
    },
    // Anthropic Messages API を呼び出す
    async callAnthropicApi(messages, config, systemInstruction, tools, forceCalling, signal) {
      const apiKey = state.settings.anthropicApiKey;
      if (!apiKey) {
        const e = new Error("Anthropic APIキーが設定されていません。設定画面で追加してください。");
        e.status = 401;
        throw e;
      }
      const effort = state.settings.anthropicEffort || null;
      const useAdaptive = !!effort;
      const useManualThinking = false;
      const useThinking = useAdaptive || useManualThinking;
      const maxTokens = useAdaptive ? Math.max(config.maxOutputTokens ?? 16e3, 16e3) : useManualThinking ? Math.max(config.maxOutputTokens ?? 4e3, state.settings.thinkingBudget + 1e3) : config.maxOutputTokens ?? 4e3;
      const cacheTTL = state.settings.anthropicCacheTTL || "5m";
      const cacheControl = cacheTTL === "none" ? null : cacheTTL === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" };
      const model = state.settings.modelName || "claude-opus-4-6";
      const requestBody = {
        model,
        messages: [],
        max_tokens: maxTokens
      };
      if (useAdaptive) {
        requestBody.thinking = { type: "adaptive" };
        requestBody.temperature = 1;
      } else if (useManualThinking) {
        requestBody.thinking = { type: "enabled", budget_tokens: state.settings.thinkingBudget };
        requestBody.temperature = 1;
      } else {
        requestBody.temperature = config.temperature ?? 0.7;
      }
      if (effort) {
        requestBody.output_config = { effort };
      }
      const _staticText = systemInstruction?._staticText;
      const _dynamicText = systemInstruction?._dynamicText;
      if (_staticText !== void 0 || _dynamicText !== void 0) {
        const blocks = [];
        if (_staticText) {
          const block = { type: "text", text: _staticText };
          if (cacheControl) block.cache_control = cacheControl;
          blocks.push(block);
        }
        if (_dynamicText) blocks.push({ type: "text", text: _dynamicText });
        if (blocks.length > 0) requestBody.system = blocks;
      } else {
        const systemText = extractSystemText(systemInstruction);
        if (systemText) {
          const block = { type: "text", text: systemText };
          if (cacheControl) block.cache_control = cacheControl;
          requestBody.system = [block];
        }
      }
      if (tools && tools.length > 0) {
        const convertTypes = /* @__PURE__ */ __name((schema) => {
          if (!schema || typeof schema !== "object") return schema;
          if (Array.isArray(schema)) return schema.map(convertTypes);
          const result = {};
          for (const [key, val] of Object.entries(schema)) {
            if (key === "type" && typeof val === "string") {
              result[key] = val.toLowerCase();
            } else if (val && typeof val === "object") {
              result[key] = convertTypes(val);
            } else {
              result[key] = val;
            }
          }
          return result;
        }, "convertTypes");
        const anthropicTools = [];
        for (const toolGroup of tools) {
          for (const decl of toolGroup.function_declarations || []) {
            anthropicTools.push({
              name: decl.name,
              description: decl.description || "",
              input_schema: convertTypes(decl.parameters) || { type: "object", properties: {} }
            });
          }
        }
        if (anthropicTools.length > 0) {
          requestBody.tools = anthropicTools;
          if (forceCalling && !useThinking) {
            requestBody.tool_choice = { type: "any" };
          }
        }
      }
      const anthropicMessages = [];
      const pushAnthropicMsg = /* @__PURE__ */ __name((role, content) => {
        const blocks = Array.isArray(content) ? content : [{ type: "text", text: content }];
        if (blocks.length === 0) return;
        const last = anthropicMessages[anthropicMessages.length - 1];
        if (last && last.role === role) {
          if (!Array.isArray(last.content)) {
            last.content = [{ type: "text", text: last.content }];
          }
          last.content = [...last.content, ...blocks];
        } else {
          anthropicMessages.push({ role, content: blocks.length === 1 && blocks[0].type === "text" ? blocks[0].text : blocks });
        }
      }, "pushAnthropicMsg");
      for (const geminiMsg of messages) {
        const msgParts = geminiMsg.parts || [];
        if (geminiMsg.role === "tool") {
          const toolResultBlocks = [];
          for (const part of msgParts) {
            if (part.functionResponse) {
              const toolUseId = part.functionResponse._toolCallId || part.functionResponse.name;
              const content = typeof part.functionResponse.response === "string" ? part.functionResponse.response : JSON.stringify(part.functionResponse.response);
              toolResultBlocks.push({ type: "tool_result", tool_use_id: toolUseId, content });
            }
          }
          if (toolResultBlocks.length > 0) pushAnthropicMsg("user", toolResultBlocks);
        } else {
          const role = geminiMsg.role === "model" ? "assistant" : "user";
          const contentBlocks = [];
          for (const part of msgParts) {
            if (part.text && part.thought !== true) {
              contentBlocks.push({ type: "text", text: part.text });
            } else if (part.functionCall) {
              contentBlocks.push({
                type: "tool_use",
                id: part.functionCall._toolCallId || `toolu_${Date.now()}`,
                name: part.functionCall.name,
                input: part.functionCall.args || {}
              });
            } else if (part.inlineData) {
              const mimeType = part.inlineData.mimeType;
              const rawData = part.inlineData.data.replace(/^data:[^;]+;base64,/, "");
              if (mimeType.startsWith("image/")) {
                const ANTHROPIC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
                if (!ANTHROPIC_IMAGE_TYPES.includes(mimeType)) {
                  const e = new Error(`Anthropic APIはこの画像形式（${mimeType}）に対応していません。JPEG・PNG・GIF・WebP形式に変換してから送信してください。※iPhoneのHEIC画像は、設定→カメラ→フォーマットを「互換性優先」に変更するか、JPEGに変換してください。`);
                  e.status = 400;
                  throw e;
                }
                contentBlocks.push({
                  type: "image",
                  source: { type: "base64", media_type: mimeType, data: rawData }
                });
              } else if (mimeType === "application/pdf") {
                contentBlocks.push({
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: rawData }
                });
              } else {
                try {
                  const decoded = decodeURIComponent(escape(atob(rawData)));
                  contentBlocks.push({ type: "text", text: decoded });
                } catch {
                  contentBlocks.push({ type: "text", text: rawData });
                }
              }
            }
          }
          if (contentBlocks.length > 0) pushAnthropicMsg(role, contentBlocks);
        }
      }
      for (let i = 0; i < anthropicMessages.length; i++) {
        const msg = anthropicMessages[i];
        if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
        const toolUseIds = msg.content.filter((b) => b.type === "tool_use").map((b) => b.id);
        if (toolUseIds.length === 0) continue;
        const nextMsg = anthropicMessages[i + 1];
        const nextContent = nextMsg && Array.isArray(nextMsg.content) ? nextMsg.content : [];
        const toolResultIds = new Set(nextContent.filter((b) => b.type === "tool_result").map((b) => b.tool_use_id));
        const orphanedIds = new Set(toolUseIds.filter((id) => !toolResultIds.has(id)));
        if (orphanedIds.size === 0) continue;
        const filtered = msg.content.filter((b) => !(b.type === "tool_use" && orphanedIds.has(b.id)));
        if (filtered.length === 0) {
          filtered.push({ type: "text", text: "(tool execution result incorporated)" });
        }
        msg.content = filtered.length === 1 && filtered[0].type === "text" ? filtered[0].text : filtered;
      }
      if (cacheControl && anthropicMessages.length >= 2) {
        requestBody.cache_control = cacheControl;
      }
      anthropicMessages.forEach((msg) => requestBody.messages.push(msg));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify(requestBody),
        signal
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const e = new Error(`Anthropic APIエラー: ${err.error?.message || response.statusText}`);
        e.status = response.status;
        throw e;
      }
      const data = await response.json();
      const parts = [];
      for (const block of data.content || []) {
        if (block.type === "thinking" && block.thinking) {
          parts.push({ text: block.thinking, thought: true });
        } else if (block.type === "text" && block.text) {
          parts.push({ text: block.text });
        } else if (block.type === "tool_use") {
          parts.push({
            functionCall: {
              name: block.name,
              args: block.input,
              _toolCallId: block.id
            }
          });
        }
      }
      if (parts.length === 0) {
        const stopReason = data.stop_reason || "";
        const errMsg = stopReason === "max_tokens" ? "Anthropic: トークン上限に達しました。会話履歴を短くするか、max_tokensを増やしてください。" : "Anthropic: 空の応答が返されました。会話内容がコンテンツポリシーに抵触しているか、Claudeがこのシーンに応じられない状態です。";
        const e = new Error(errMsg);
        e.status = 400;
        throw e;
      }
      const geminiFormat = {
        candidates: [{
          content: { parts },
          finishReason: "STOP"
        }]
      };
      if (data.usage) {
        const cacheWrite = data.usage.cache_creation_input_tokens || 0;
        const cacheRead = data.usage.cache_read_input_tokens || 0;
        const cacheCreation = data.usage.cache_creation || {};
        const cacheWrite5m = cacheCreation.ephemeral_5m_input_tokens ?? (cacheTTL === "1h" ? 0 : cacheWrite);
        const cacheWrite1h = cacheCreation.ephemeral_1h_input_tokens ?? (cacheTTL === "1h" ? cacheWrite : 0);
        const inputTotal = (data.usage.input_tokens || 0) + cacheWrite + cacheRead;
        console.log(`[Cache] cache_write=${cacheWrite} cache_read=${cacheRead} input=${data.usage.input_tokens || 0} output=${data.usage.output_tokens || 0}`);
        geminiFormat.usageMetadata = {
          promptTokenCount: inputTotal,
          candidatesTokenCount: data.usage.output_tokens || 0,
          totalTokenCount: inputTotal + (data.usage.output_tokens || 0),
          cacheCreationInputTokens: cacheWrite,
          cacheReadInputTokens: cacheRead,
          cacheCreation5mInputTokens: cacheWrite5m,
          cacheCreation1hInputTokens: cacheWrite1h
        };
      }
      return { ok: true, status: 200, json: /* @__PURE__ */ __name(async () => geminiFormat, "json") };
    },
    // OpenAI互換プロバイダー（Function Calling非対応: Groq / DeepSeek / xAI / Mistral）の共通実装
    async callOpenAICompatibleApi(apiKey, baseUrl, providerName, messages, config, systemInstruction, signal) {
      if (!apiKey) {
        const e = new Error(`${providerName} APIキーが設定されていません。設定画面で追加してください。`);
        e.status = 401;
        throw e;
      }
      const model = state.settings.modelName;
      const isReasoningModel = /r1|reasoner/i.test(model);
      const requestBody = {
        model,
        messages: [],
        max_tokens: config.maxOutputTokens ?? 4e3,
        stream: false
      };
      if (!isReasoningModel) {
        requestBody.temperature = config.temperature ?? 0.7;
        requestBody.top_p = config.topP ?? 1;
      }
      const systemText = extractSystemText(systemInstruction);
      if (systemText) requestBody.messages.push({ role: "system", content: systemText });
      this.convertGeminiToOpenAIFormat(messages).forEach((msg) => requestBody.messages.push(msg));
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody),
        signal
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const e = new Error(`${providerName} APIエラー: ${err.error?.message || response.statusText}`);
        e.status = response.status;
        throw e;
      }
      const data = await response.json();
      const geminiFormat = this.convertOpenAIToGeminiFormat(data);
      return { ok: true, status: 200, json: /* @__PURE__ */ __name(async () => geminiFormat, "json") };
    },
    // プロジェクトのナレッジファイルをsystemInstructionへ注入する（旧 app.js モンキーパッチより移設）
    _injectProjectKnowledge(systemInstruction) {
      const knowledge = state.activeProjectKnowledge;
      if (knowledge && knowledge.length > 0) {
        const knowledgeText = knowledge.map((f) => `### ${f.name}
${f.content}`).join("\n\n---\n\n");
        const prevStatic = systemInstruction?._staticText !== void 0 ? systemInstruction._staticText : extractSystemText(systemInstruction) || "";
        const prevDynamic = systemInstruction?._dynamicText || "";
        const newStaticText = prevStatic ? `${prevStatic}

---
## ナレッジ

${knowledgeText}` : `## ナレッジ

${knowledgeText}`;
        const combined = [prevDynamic, newStaticText].filter(Boolean).join("\n\n");
        return {
          parts: [{ text: combined }],
          _staticText: newStaticText,
          _dynamicText: prevDynamic
        };
      }
      return systemInstruction;
    },
    // プロバイダーに応じて適切なAPIアダプタへ振り分けるディスパッチャ。
    // ナレッジ注入もここで一括して行う（旧 app.js のモンキーパッチを統合）。
    async callApi(messagesForApi, generationConfig, systemInstruction, tools = null, forceCalling = false, signal = null) {
      systemInstruction = this._injectProjectKnowledge(systemInstruction);
      const provider = state.settings.apiProvider || "gemini";
      switch (provider) {
        case "zai":
          return await this._callOpenAICompatibleWithTools({
            label: "Z.ai",
            baseUrl: ZAI_API_BASE_URL,
            defaultModel: DEFAULT_ZAI_MODEL,
            getApiKey: /* @__PURE__ */ __name(() => state.settings.zaiApiKey || state.settings.apiKey, "getApiKey"),
            missingKeyMessage: "Z.ai APIキーが設定されていません。",
            extraHeaders: /* @__PURE__ */ __name(() => ({}), "extraHeaders"),
            verboseError: false
          }, messagesForApi, generationConfig, systemInstruction, forceCalling, signal);
        case "openrouter":
          return await this._callOpenAICompatibleWithTools({
            label: "OpenRouter",
            baseUrl: OPENROUTER_API_BASE_URL,
            defaultModel: DEFAULT_OPENROUTER_MODEL,
            getApiKey: /* @__PURE__ */ __name(() => state.settings.openrouterApiKey, "getApiKey"),
            missingKeyMessage: "OpenRouter APIキーが設定されていません。",
            extraHeaders: /* @__PURE__ */ __name(() => ({ "HTTP-Referer": window.location.origin, "X-Title": "PWA-lily" }), "extraHeaders"),
            verboseError: true
          }, messagesForApi, generationConfig, systemInstruction, forceCalling, signal);
        case "bedrock":
          return await this.callBedrockApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, signal);
        case "openai":
          return await this.callOpenAIApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, signal);
        case "anthropic":
          return await this.callAnthropicApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, signal);
        case "groq":
          return await this.callOpenAICompatibleApi(state.settings.groqApiKey, GROQ_API_BASE_URL, "Groq", messagesForApi, generationConfig, systemInstruction, signal);
        case "deepseek":
          return await this.callOpenAICompatibleApi(state.settings.deepseekApiKey, DEEPSEEK_API_BASE_URL, "DeepSeek", messagesForApi, generationConfig, systemInstruction, signal);
        case "xai":
          return await this.callOpenAICompatibleApi(state.settings.xaiApiKey, XAI_API_BASE_URL, "xAI", messagesForApi, generationConfig, systemInstruction, signal);
        case "mistral":
          return await this.callOpenAICompatibleApi(state.settings.mistralApiKey, MISTRAL_API_BASE_URL, "Mistral", messagesForApi, generationConfig, systemInstruction, signal);
        case "sakana":
          return await this._callOpenAICompatibleWithTools({
            label: "Sakana",
            baseUrl: SAKANA_API_BASE_URL,
            defaultModel: DEFAULT_SAKANA_MODEL,
            getApiKey: /* @__PURE__ */ __name(() => state.settings.sakanaApiKey, "getApiKey"),
            missingKeyMessage: "Sakana APIキーが設定されていません。",
            extraHeaders: /* @__PURE__ */ __name(() => ({}), "extraHeaders"),
            verboseError: false
          }, messagesForApi, generationConfig, systemInstruction, forceCalling, signal);
        default:
          return await this.callGeminiApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, signal);
      }
    }
  };

  // src/app-logic/message.js
  var messageMethods = {
    async proofreadText(textToProofread) {
      console.log("--- 校正処理開始 ---");
      const {
        proofreadingModelName,
        proofreadingSystemInstruction,
        apiKey,
        temperature,
        maxTokens,
        topK,
        topP,
        enableAutoRetry,
        maxRetries
      } = state.settings;
      if (!proofreadingModelName) {
        throw new Error("校正用モデルが設定されていません。");
      }
      const endpoint = `${GEMINI_API_BASE_URL}${proofreadingModelName}:generateContent`;
      const systemInstruction = proofreadingSystemInstruction?.trim() ? { parts: [{ text: proofreadingSystemInstruction.trim() }] } : null;
      const generationConfig = {};
      if (temperature !== null) generationConfig.temperature = temperature;
      if (maxTokens !== null) generationConfig.maxOutputTokens = maxTokens;
      if (topK !== null) generationConfig.topK = topK;
      if (topP !== null) generationConfig.topP = topP;
      const requestBody = {
        contents: [{ role: "user", parts: [{ text: textToProofread }] }],
        ...Object.keys(generationConfig).length > 0 && { generationConfig },
        ...systemInstruction && { systemInstruction },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };
      if (state.settings.dummyEnabled && state.settings.applyDummyToProofread && state.settings.dummyUser) {
        requestBody.contents.push({
          role: "user",
          parts: [{ text: state.settings.dummyUser }]
        });
        console.log("校正リクエストにダミーUserプロンプトを適用しました。");
      }
      console.log("校正APIへの送信データ:", JSON.stringify(requestBody, null, 2));
      let lastError = null;
      const maxProofreadRetries = enableAutoRetry ? maxRetries : 0;
      for (let attempt = 0; attempt <= maxProofreadRetries; attempt++) {
        try {
          if (state.abortController?.signal.aborted) {
            throw new Error("リクエストがキャンセルされました。");
          }
          if (attempt > 0) {
            let delay;
            if (state.settings.useFixedRetryDelay) {
              delay = state.settings.fixedRetryDelaySeconds * 1e3;
            } else {
              const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
              const maxDelay = state.settings.maxBackoffDelaySeconds * 1e3;
              delay = Math.min(exponentialDelay, maxDelay);
            }
            uiUtils.setLoadingIndicatorText(`校正エラー 再試行(${attempt}回目)... ${Math.round(delay / 1e3)}秒待機`);
            console.log(`校正APIリトライ ${attempt}: ${delay}ms待機...`);
            await interruptibleSleep(delay, state.abortController.signal);
          }
          if (attempt === 0) {
            uiUtils.setLoadingIndicatorText("校正中...");
          } else if (attempt === 1) {
            uiUtils.setLoadingIndicatorText("校正処理を再試行中...");
          } else {
            uiUtils.setLoadingIndicatorText(`校正処理${attempt}回目の再試行中...`);
          }
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(requestBody),
            signal: state.abortController?.signal
          });
          if (!response.ok) {
            let errorMsg = `校正APIエラー (${response.status}): ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData.error?.message) {
                errorMsg = `校正APIエラー (${response.status}): ${errorData.error.message}`;
              }
            } catch (e) {
            }
            const error = new Error(errorMsg);
            error.status = response.status;
            throw error;
          }
          const responseData = await response.json();
          if (responseData.candidates?.[0]?.content?.parts) {
            const proofreadContent = responseData.candidates[0].content.parts.map((p) => p.text).join("");
            console.log("--- 校正処理成功 ---");
            return proofreadContent;
          } else if (responseData.promptFeedback) {
            const blockReason = responseData.promptFeedback.blockReason || "SAFETY";
            throw new Error(`校正モデルに応答がブロックされました (理由: ${blockReason})`);
          } else {
            throw new Error("校正APIの応答に有効なコンテンツが含まれていません。");
          }
        } catch (error) {
          lastError = error;
          if (error.name === "AbortError") {
            throw error;
          }
          if (error.status && error.status >= 400 && error.status < 500) {
            console.error(`リトライ不可の校正エラー (ステータス: ${error.status})。`, error);
            throw error;
          }
          console.warn(`校正API呼び出し試行 ${attempt + 1} が失敗。`, error);
        }
      }
      console.error("校正APIの最大リトライ回数に達しました。");
      throw lastError;
    },
    /**
     * @private API通信と応答解析、ループ処理に責務を特化した内部関数。
     * stateの変更やUIの更新は一切行わない。
     * @param {Array} messagesForApi - APIに送信するメッセージ履歴。
     * @param {object} generationConfig - 生成設定。
     * @param {object} systemInstruction - システムプロンプト。
     * @returns {Promise<Array>} 生成された新しいメッセージオブジェクトの配列。
    */
    async _internalHandleSend(messagesForApi, generationConfig, systemInstruction) {
      let loopCount = 0;
      const MAX_LOOPS = 20;
      const finalTurnResults = [];
      let currentTurnHistory = [...messagesForApi];
      let aggregatedSearchResults = [];
      uiUtils.setLoadingIndicatorText("応答生成中...");
      while (loopCount < MAX_LOOPS) {
        loopCount++;
        const result = await this.callApiWithRetry({
          messagesForApi: currentTurnHistory,
          generationConfig,
          systemInstruction,
          tools: window.functionDeclarations,
          isFirstCall: loopCount === 1
        });
        const modelMessage = {
          role: "model",
          content: result.content || "",
          thoughtSummary: finalTurnResults.length === 0 ? result.thoughtSummary : null,
          tool_calls: result.toolCalls,
          timestamp: Date.now(),
          finishReason: result.finishReason,
          safetyRatings: result.safetyRatings,
          usageMetadata: result.usageMetadata,
          retryCount: result.retryCount,
          executedFunctions: []
        };
        finalTurnResults.push(modelMessage);
        if (!result.toolCalls || result.toolCalls.length === 0) {
          console.log("[_internalHandleSend] ツール呼び出しがないため、ループを終了します。");
          break;
        }
        const historyForFunctions = state.currentMessages.slice(0, -1);
        const responseTextForQc = result.content || "";
        const toolResults = [];
        let containsTerminalAction = false;
        for (const toolCall of result.toolCalls) {
          const functionName = toolCall.functionCall.name;
          const functionArgs = toolCall.functionCall.args;
          console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);
          if (functionName === "generate_image_stable_diffusion") {
            uiUtils.setLoadingIndicatorText("SDで画像生成中...");
          } else if (functionName === "generate_image_novelai") {
            uiUtils.setLoadingIndicatorText("NovelAIで画像生成中...");
          } else if (functionName === "run_quality_checker") {
            uiUtils.setLoadingIndicatorText("品質チェック中...");
          } else {
            uiUtils.setLoadingIndicatorText("関数実行中...");
          }
          let toolResult;
          try {
            const argsWithContext = { ...functionArgs, _responseTextForQc: responseTextForQc };
            toolResult = await window.functionCallingTools[functionName](argsWithContext, {
              messages: historyForFunctions.filter((m) => m.role !== "tool"),
              persistentMemory: state.currentPersistentMemory
            });
          } catch (toolError) {
            console.error(`[_internalHandleSend] ${functionName}の実行中に予期せぬエラー:`, toolError);
            toolResult = { error: { message: `ツール実行中に予期せぬエラーが発生しました: ${toolError.message}` } };
          }
          if (["generate_image", "generate_image_stable_diffusion", "generate_image_novelai", "generate_video", "edit_image", "display_layered_image"].includes(functionName)) {
            containsTerminalAction = true;
            console.log(`[Function Calling] 終端アクション (${functionName}) を検出しました。`);
          }
          const responseForAI = { ...toolResult };
          if (toolResult.search_results) {
            aggregatedSearchResults.push(...toolResult.search_results);
            delete responseForAI.search_results;
          }
          if (toolResult._internal_ui_action) {
            delete responseForAI._internal_ui_action;
          }
          const toolResponseMessage = {
            role: "tool",
            name: functionName,
            response: responseForAI,
            timestamp: Date.now(),
            _toolCallId: toolCall.functionCall._toolCallId
            // OpenAI互換APIのtool_call_idを保持
          };
          if (toolResult._internal_ui_action) {
            toolResponseMessage._internal_ui_action = toolResult._internal_ui_action;
          }
          toolResults.push(toolResponseMessage);
          modelMessage.executedFunctions.push(functionName);
        }
        finalTurnResults.push(...toolResults);
        if (containsTerminalAction) {
          console.log("終端アクションが検出されたため、Function Callingループを終了します。");
          if (!result.content) {
            console.log("[_internalHandleSend] テキスト応答がなかったため、ツール結果を基に最終応答を生成します。");
            uiUtils.setLoadingIndicatorText("最終応答を生成中...");
            const partsForApi2 = [
              ...result.thoughtParts || [],
              ...result.toolCalls.map((tc) => ({ functionCall: tc.functionCall }))
            ];
            const modelMessageForApi2 = { role: "model", parts: partsForApi2 };
            const toolResultsForApi2 = toolResults.map((tr) => ({
              role: "tool",
              parts: [{
                functionResponse: {
                  name: tr.name,
                  response: tr.response,
                  _toolCallId: tr._toolCallId
                  // OpenAI互換APIのtool_call_idを引き継ぐ
                }
              }]
            }));
            currentTurnHistory.push(modelMessageForApi2, ...toolResultsForApi2);
            if (state.settings.apiProvider === "bedrock") {
              const delayMs = 6500;
              console.log(`[Bedrock] レート制限回避のため ${delayMs}ms 待機します...`);
              uiUtils.setLoadingIndicatorText(`レート制限回避のため ${delayMs / 1e3}秒待機中...`);
              await interruptibleSleep(delayMs, state.abortController.signal);
            }
            const textResult = await this.callApiWithRetry({
              messagesForApi: currentTurnHistory,
              generationConfig,
              systemInstruction,
              tools: null,
              isFirstCall: false
            });
            modelMessage.content = textResult.content || "";
          }
          break;
        }
        const partsForApi = [
          ...result.thoughtParts || [],
          ...result.toolCalls.map((tc) => ({ functionCall: tc.functionCall }))
        ];
        const modelMessageForApi = { role: "model", parts: partsForApi };
        const toolResultsForApi = toolResults.map((tr) => ({
          role: "tool",
          parts: [{
            functionResponse: {
              name: tr.name,
              response: tr.response,
              _toolCallId: tr._toolCallId
              // OpenAI互換APIのtool_call_idを引き継ぐ
            }
          }]
        }));
        currentTurnHistory.push(modelMessageForApi, ...toolResultsForApi);
        if (state.settings.apiProvider === "bedrock") {
          const delayMs = 6500;
          console.log(`[Bedrock] レート制限回避のため ${delayMs}ms 待機します...`);
          uiUtils.setLoadingIndicatorText(`レート制限回避のため ${delayMs / 1e3}秒待機中...`);
          await interruptibleSleep(delayMs, state.abortController.signal);
        }
        uiUtils.setLoadingIndicatorText("応答生成中...");
      }
      if (loopCount >= MAX_LOOPS) {
        console.warn("Function Callingのループが上限に達しました。");
        const finalErrorMessage = {
          role: "model",
          content: "AIが同じ操作を繰り返しているようです。処理を中断しました。プロンプトを修正して再度お試しください。",
          timestamp: Date.now()
        };
        finalTurnResults.push(finalErrorMessage);
      }
      const finalModelMessages = finalTurnResults.filter((m) => m.role === "model");
      if (finalModelMessages.length > 0) {
        if (aggregatedSearchResults.length > 0) {
          const lastMessage = finalModelMessages[finalModelMessages.length - 1];
          lastMessage.search_web_results = aggregatedSearchResults;
        }
        if (state.settings.enableProofreading) {
          const lastTextResponse = finalModelMessages.filter((m) => m.content).pop();
          if (lastTextResponse) {
            try {
              uiUtils.setLoadingIndicatorText("校正中...");
              lastTextResponse.content = await this.proofreadText(lastTextResponse.content);
            } catch (proofreadError) {
              console.error("校正処理中にエラーが発生しました。校正前のテキストを使用します。", proofreadError);
            }
          }
        }
        if (state.settings.enableThoughtTranslation) {
          for (const msg of finalModelMessages) {
            if (msg.thoughtSummary) {
              try {
                uiUtils.setLoadingIndicatorText("思考プロセスを翻訳中...");
                msg.thoughtSummary = await apiUtils.translateText(msg.thoughtSummary, state.settings.thoughtTranslationModel);
              } catch (translateError) {
                console.error("思考プロセスの翻訳中にエラーが発生しました。原文を使用します。", translateError);
              }
            }
          }
        }
      }
      return finalTurnResults;
    },
    /**
     * @private _internalHandleSendから返されたメッセージ配列を単一のオブジェクトに集約する。
     */
    _aggregateMessages(messages) {
      const primaryModelMessage = [...messages].reverse().find((m) => m.role === "model" && m.content) || [...messages].reverse().find((m) => m.role === "model");
      if (!primaryModelMessage) {
        console.warn("[_aggregateMessages] プライマリとなるモデルメッセージが見つかりませんでした。");
        return { role: "model", content: "", timestamp: Date.now(), imageIds: [] };
      }
      const finalAggregatedMessage = JSON.parse(JSON.stringify(primaryModelMessage));
      finalAggregatedMessage.imageIds = finalAggregatedMessage.imageIds || [];
      finalAggregatedMessage.executedFunctions = finalAggregatedMessage.executedFunctions || [];
      finalAggregatedMessage.generated_videos = finalAggregatedMessage.generated_videos || [];
      messages.forEach((msg) => {
        if (msg.role === "model" && msg !== primaryModelMessage) {
          if (msg.executedFunctions) {
            finalAggregatedMessage.executedFunctions.push(...msg.executedFunctions);
          }
        }
        if (msg.role === "tool" && msg._internal_ui_action) {
          const actions = Array.isArray(msg._internal_ui_action) ? msg._internal_ui_action : [msg._internal_ui_action];
          actions.forEach((action) => {
            if (action.type === "display_generated_images" && action.imageIds) {
              finalAggregatedMessage.imageIds.push(...action.imageIds);
            }
            if (action.type === "display_generated_videos" && action.videos) {
              finalAggregatedMessage.generated_videos.push(...action.videos);
            }
          });
        }
      });
      finalAggregatedMessage.imageIds = [...new Set(finalAggregatedMessage.imageIds)];
      finalAggregatedMessage.executedFunctions = [...new Set(finalAggregatedMessage.executedFunctions)];
      finalAggregatedMessage.timestamp = Date.now();
      return finalAggregatedMessage;
    },
    async handleSend() {
      state.pendingCascadeResponses = null;
      if (state.isSending) {
        return;
      }
      if (state.editingMessageIndex !== null) {
        await uiUtils.showCustomAlert("他のメッセージを編集中です。");
        return;
      }
      if (state.isEditingSystemPrompt) {
        await uiUtils.showCustomAlert("システムプロンプトを編集中です。");
        return;
      }
      const text = elements.userInput.value.trim();
      const attachmentsToSend = [...state.pendingAttachments];
      if (!text && attachmentsToSend.length === 0) return;
      uiUtils.setSendingState(true);
      uiUtils.setLoadingIndicatorText("応答生成中...");
      const userMessage = { role: "user", content: text, timestamp: Date.now(), attachments: attachmentsToSend };
      state.currentMessages.push(userMessage);
      uiUtils.appendMessage(userMessage.role, userMessage.content, state.currentMessages.length - 1, false, null, userMessage.attachments);
      const baseHistory = state.currentMessages.filter((msg) => !msg.isCascaded || msg.isSelected);
      const modelMessage = { role: "model", content: "", timestamp: Date.now() };
      state.currentMessages.push(modelMessage);
      const modelMessageIndex = state.currentMessages.length - 1;
      uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);
      state.pendingAttachments = [];
      state.selectedFilesForUpload = [];
      uiUtils.updateAttachmentBadgeVisibility();
      elements.userInput.value = "";
      uiUtils.adjustTextareaHeight();
      if (state.settings.autoScroll) {
        this.scrollToBottom();
      }
      await dbUtils.saveChat(null, null, { skipPush: true });
      try {
        const generationConfig = {};
        if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
        if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
        if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
        if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
        if ((state.settings.apiProvider || "gemini") === "gemini" && (state.settings.thinkingBudget > 0 || state.settings.includeThoughts)) {
          generationConfig.thinkingConfig = {};
          if (state.settings.thinkingBudget > 0) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
          if (state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
        }
        const summaryText = this._buildSummaryForPrompt();
        const staticText = state.currentSystemPrompt?.trim() || "";
        const dynamicParts = [];
        if (summaryText) dynamicParts.push(summaryText);
        if (state.settings.enableMemory && state.isMemoryEnabledForChat && state.activeProfileId) {
          const memoryData = await dbUtils.getMemory(state.activeProfileId);
          if (memoryData && memoryData.items && memoryData.items.length > 0) {
            const memoryBlock = `[長期記憶]
- ${memoryData.items.join("\n- ")}
---`;
            dynamicParts.unshift(memoryBlock);
            console.log("長期記憶をシステムプロンプトに挿入しました。");
          }
        }
        const dynamicText = dynamicParts.join("\n\n");
        const finalSystemPrompt = [dynamicText, staticText].filter(Boolean).join("\n\n");
        const systemInstruction = finalSystemPrompt ? {
          role: "system",
          parts: [{ text: finalSystemPrompt }],
          _staticText: staticText,
          _dynamicText: dynamicText
        } : null;
        const historyForApi = this._prepareApiHistory(baseHistory);
        const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
        const finalAggregatedMessage = this._aggregateMessages(newMessages);
        finalAggregatedMessage.modelName = state.settings.modelName;
        state.currentMessages[modelMessageIndex] = finalAggregatedMessage;
        uiUtils.renderChatMessages();
        await dbUtils.saveChat(null, null, { skipPush: true });
        this.autoGenerateTitle().catch((e) => console.warn("[AutoTitle] エラー:", e.message));
        this.updateCharacterProfileButtonVisibility();
        const interval = parseInt(state.settings.memoryAutoSaveInterval, 10);
        const userMessageCount = state.currentMessages.filter((m) => m.role === "user").length;
        if (state.settings.enableMemory && state.isMemoryEnabledForChat && interval > 0 && userMessageCount > 0 && userMessageCount % interval === 0) {
          console.log(`[Memory] ユーザーの発言数が ${userMessageCount} 回に達したため、自動学習を開始します。`);
          this.triggerAutoMemorySave();
        }
      } catch (error) {
        console.error("--- handleSend: 最終catchブロックでエラー捕捉 ---", error);
        const errorMessage = error.name !== "AbortError" ? error.message || "不明なエラーが発生しました。" : "リクエストがキャンセルされました。";
        state.currentMessages[modelMessageIndex] = { role: "error", content: errorMessage, timestamp: Date.now() };
        uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());
        await dbUtils.saveChat(null, null, { skipPush: true });
      } finally {
        uiUtils.setSendingState(false);
        state.abortController = null;
        this.markAsDirtyAndSchedulePush("message");
        if (state.settings.autoScroll) {
          requestAnimationFrame(() => {
            this.scrollToBottom();
          });
        }
      }
    },
    // APIリクエストを中断
    abortRequest() {
      if (state.abortController) {
        console.log("中断リクエスト送信");
        state.abortController.abort();
      } else {
        console.log("中断するアクティブなリクエストがありません。");
      }
    },
    async executeToolCalls(toolCalls, historyForFunctions, responseTextForQc = "") {
      const messagesForFunction = (historyForFunctions || []).map((c) => c.originalMessage || c);
      const dummyUserCount = state.settings.dummyUser ? 1 : 0;
      const dummyModelCount = state.settings.dummyModel ? 1 : 0;
      const dummyPromptCount = dummyUserCount + dummyModelCount;
      const chat = {
        id: state.currentChatId,
        messages: messagesForFunction.filter((m) => m.role !== "tool"),
        systemPrompt: state.currentSystemPrompt,
        persistentMemory: state.currentPersistentMemory,
        dummy_prompt_count: dummyPromptCount
        // 計算したダミーの数を追加
      };
      const toolResults = [];
      let containsTerminalAction = false;
      let aggregatedSearchResults = [];
      let internalUiActions = [];
      for (const toolCall of toolCalls) {
        const functionName = toolCall.functionCall.name;
        const functionArgs = toolCall.functionCall.args;
        console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);
        if (["generate_image", "generate_video", "edit_image", "display_layered_image", "run_quality_checker"].includes(functionName)) {
          containsTerminalAction = true;
          console.log(`[Function Calling] 終端アクション (${functionName}) を検出しました。`);
        }
        let result;
        if (window.functionCallingTools && typeof window.functionCallingTools[functionName] === "function") {
          try {
            const argsWithContext = { ...functionArgs, _responseTextForQc: responseTextForQc };
            result = await window.functionCallingTools[functionName](argsWithContext, chat);
          } catch (e) {
            console.error(`[Function Calling] 関数 '${functionName}' の実行中にエラーが発生しました:`, e);
            result = { error: `関数実行中の内部エラー: ${e.message}` };
          }
        } else {
          console.error(`[Function Calling] 関数 '${functionName}' が見つかりません。`);
          result = { error: `関数 '${functionName}' が見つかりません。` };
        }
        const responseForAI = { ...result };
        if (result.search_results) {
          aggregatedSearchResults.push(...result.search_results);
          delete responseForAI.search_results;
        }
        if (result._internal_ui_action) {
          console.log(`[Debug] executeToolCalls: _internal_ui_actionを検出`, result._internal_ui_action);
          internalUiActions.push(result._internal_ui_action);
          if (result._internal_ui_action.type === "display_layered_image") {
            containsTerminalAction = true;
          }
          delete responseForAI._internal_ui_action;
        }
        toolResults.push({
          role: "tool",
          name: functionName,
          response: responseForAI,
          timestamp: Date.now(),
          _toolCallId: toolCall.functionCall._toolCallId
          // Bedrock API用にtoolCallIdを保持
        });
        if (containsTerminalAction) {
          break;
        }
      }
      if (chat.persistentMemory) {
        state.currentPersistentMemory = chat.persistentMemory;
      }
      await dbUtils.saveChat();
      state.currentScene = state.currentPersistentMemory?.scene_stack?.slice(-1)[0] || null;
      state.currentStyleProfiles = state.currentPersistentMemory?.style_profiles || {};
      return { toolResults, containsTerminalAction, search_results: aggregatedSearchResults, internalUiActions };
    },
    // --- システムプロンプト編集 ---
    startEditSystemPrompt() {
      if (state.isSending) return;
      state.isEditingSystemPrompt = true;
      elements.systemPromptEditor.value = state.currentSystemPrompt;
      uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
      elements.systemPromptEditor.focus();
      console.log("システムプロンプト編集開始");
    },
    async saveCurrentSystemPrompt() {
      const newPrompt = elements.systemPromptEditor.value.trim();
      if (newPrompt !== state.currentSystemPrompt) {
        state.currentSystemPrompt = newPrompt;
        try {
          await dbUtils.saveChat();
          await sleep(100);
          console.log("システムプロンプト保存完了");
        } catch (error) {
          await uiUtils.showCustomAlert("システムプロンプトの保存に失敗しました。");
        }
      }
      state.isEditingSystemPrompt = false;
      elements.systemPromptDetails.removeAttribute("open");
    },
    cancelEditSystemPrompt() {
      state.isEditingSystemPrompt = false;
      elements.systemPromptEditor.value = state.currentSystemPrompt;
      elements.systemPromptDetails.removeAttribute("open");
      uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
      console.log("システムプロンプト編集キャンセル");
    },
    // -----------------------------
    // --- メッセージアクション ---
    // メッセージ編集開始
    async startEditMessage(index, messageElement) {
      const startTime = performance.now();
      console.log(`[PERF_DEBUG] startEditMessage 開始 (index: ${index})`);
      if (state.isSending) {
        await uiUtils.showCustomAlert("送信中は編集できません。");
        return;
      }
      if (state.editingMessageIndex !== null && state.editingMessageIndex !== index) {
        await uiUtils.showCustomAlert("他のメッセージを編集中です。");
        return;
      }
      if (state.isEditingSystemPrompt) {
        await uiUtils.showCustomAlert("システムプロンプトを編集中です。");
        return;
      }
      if (state.editingMessageIndex === index) {
        messageElement.querySelector(".edit-textarea")?.focus();
        return;
      }
      const message = state.currentMessages[index];
      if (!message) return;
      const rawContent = message.content;
      state.editingMessageIndex = index;
      const contentDiv = messageElement.querySelector(".message-content");
      const editArea = messageElement.querySelector(".message-edit-area");
      const cascadeControls = messageElement.querySelector(".message-cascade-controls");
      editArea.innerHTML = "";
      let horizontalPadding = 0;
      try {
        const computedStyle = window.getComputedStyle(messageElement);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        horizontalPadding = paddingLeft + paddingRight;
      } catch (e) {
        console.error("幅の動的計算中にエラー:", e);
      }
      messageElement.style.width = `calc(var(--message-max-width) + ${horizontalPadding}px + 17px)`;
      const textarea = document.createElement("textarea");
      textarea.value = rawContent;
      textarea.classList.add("edit-textarea");
      textarea.rows = 3;
      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("message-edit-actions");
      const saveButton = document.createElement("button");
      saveButton.textContent = "保存";
      saveButton.classList.add("save-edit-btn");
      saveButton.onclick = () => this.saveEditMessage(index, messageElement);
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "キャンセル";
      cancelButton.classList.add("cancel-edit-btn");
      cancelButton.onclick = () => this.cancelEditMessage(index, messageElement);
      const copyEditButton = document.createElement("button");
      copyEditButton.textContent = "コピー";
      copyEditButton.classList.add("copy-edit-btn");
      copyEditButton.onclick = () => {
        navigator.clipboard.writeText(textarea.value).then(() => {
          copyEditButton.textContent = "コピー済";
          setTimeout(() => {
            copyEditButton.textContent = "コピー";
          }, 1500);
        });
      };
      actionsDiv.appendChild(saveButton);
      actionsDiv.appendChild(cancelButton);
      actionsDiv.appendChild(copyEditButton);
      editArea.appendChild(textarea);
      editArea.appendChild(actionsDiv);
      messageElement.classList.add("editing");
      if (contentDiv) contentDiv.classList.add("hidden");
      if (cascadeControls) cascadeControls.classList.add("hidden");
      editArea.classList.remove("hidden");
      uiUtils.adjustTextareaHeight(textarea, 400);
      textarea.focus();
      textarea.select();
      const endTime = performance.now();
      console.log(`[PERF_DEBUG] startEditMessage 完了 (所要時間: ${endTime - startTime}ms)`);
    },
    // メッセージ編集を保存
    async saveEditMessage(index, messageElement) {
      const textarea = messageElement.querySelector(".edit-textarea");
      if (!textarea) {
        this.cancelEditMessage(index, messageElement);
        return;
      }
      const newRawContent = textarea.value;
      const originalMessage = state.currentMessages[index];
      if (newRawContent === originalMessage.content) {
        this.cancelEditMessage(index, messageElement);
        return;
      }
      const updatedMessage = {
        ...originalMessage,
        content: newRawContent,
        timestamp: Date.now()
      };
      delete updatedMessage.error;
      state.currentMessages[index] = updatedMessage;
      messageElement.querySelectorAll(".function-call-details, .citation-details").forEach((el) => el.remove());
      const contentDiv = messageElement.querySelector(".message-content");
      if (contentDiv) {
        if (updatedMessage.role === "model" && typeof marked !== "undefined") {
          contentDiv.innerHTML = htmlUtils.renderMarkdownSafe(newRawContent);
        } else {
          const pre = contentDiv.querySelector("pre") || document.createElement("pre");
          pre.textContent = newRawContent;
          if (!contentDiv.querySelector("pre")) {
            contentDiv.innerHTML = "";
            contentDiv.appendChild(pre);
          }
        }
      }
      const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
      if (updatedMessage.role === "model" && updatedMessage.imageIds && updatedMessage.imageIds.length > 0) {
        let imageIndex = 0;
        const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
          if (imageIndex < updatedMessage.imageIds.length) {
            const imageId = updatedMessage.imageIds[imageIndex++];
            return `<img class="lazy-load-image" alt="生成画像（読み込み中...）" data-image-id="${imageId}">`;
          }
          return "";
        });
        contentDiv.innerHTML = replacedHtml;
        if (imageIndex < updatedMessage.imageIds.length) {
          const fragment = document.createDocumentFragment();
          for (let i = imageIndex; i < updatedMessage.imageIds.length; i++) {
            const imageId = updatedMessage.imageIds[i];
            const img = document.createElement("img");
            img.className = "lazy-load-image";
            img.alt = "生成画像（読み込み中...）";
            img.dataset.imageId = imageId;
            fragment.appendChild(img);
          }
          contentDiv.appendChild(fragment);
        }
        requestAnimationFrame(() => {
          const newImages = contentDiv.querySelectorAll(".lazy-load-image[data-image-id]");
          newImages.forEach((img) => this.imageObserver.observe(img));
        });
      }
      if (updatedMessage.role === "model") {
        const detailsFragment = document.createDocumentFragment();
        if (updatedMessage.executedFunctions && updatedMessage.executedFunctions.length > 0) {
          const details = document.createElement("details");
          details.classList.add("function-call-details");
          const uniqueFunctions = [...new Set(updatedMessage.executedFunctions)];
          const summary = document.createElement("summary");
          summary.innerHTML = `⚙️ ツール使用 (${uniqueFunctions.length}件)`;
          details.appendChild(summary);
          const list = document.createElement("ul");
          list.classList.add("function-call-list");
          uniqueFunctions.forEach((funcName) => {
            const listItem = document.createElement("li");
            listItem.textContent = funcName;
            list.appendChild(listItem);
          });
          details.appendChild(list);
          detailsFragment.appendChild(details);
        }
        if (updatedMessage.search_web_results && updatedMessage.search_web_results.length > 0) {
          const details = document.createElement("details");
          details.classList.add("function-call-details");
          const summary = document.createElement("summary");
          summary.innerHTML = `🌐 Web検索結果 (${updatedMessage.search_web_results.length}件)`;
          details.appendChild(summary);
          const list = document.createElement("ul");
          list.classList.add("function-call-list");
          updatedMessage.search_web_results.forEach((result) => {
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = result.link;
            link.textContent = result.title;
            link.title = result.snippet;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            listItem.appendChild(link);
            list.appendChild(listItem);
          });
          details.appendChild(list);
          detailsFragment.appendChild(details);
        }
        if (contentDiv.innerHTML.trim() !== "") {
          contentDiv.appendChild(detailsFragment);
        } else {
          messageElement.appendChild(detailsFragment);
        }
      }
      if (window.Prism) {
        contentDiv.querySelectorAll("pre code").forEach((block) => {
          Prism.highlightElement(block);
        });
      }
      this.finishEditing(messageElement);
      try {
        const requiresTitleUpdate = index === state.currentMessages.findIndex((m) => m.role === "user");
        let newTitleForSave = null;
        if (requiresTitleUpdate) {
          newTitleForSave = newRawContent.substring(0, 50) || "無題のチャット";
        }
        await dbUtils.saveChat(newTitleForSave);
        if (requiresTitleUpdate) {
          uiUtils.updateChatTitle(newTitleForSave);
        }
        console.log("メッセージ編集後にチャット保存:", index);
      } catch (error) {
        await uiUtils.showCustomAlert("メッセージ編集後のチャット保存に失敗しました。");
      }
    },
    // メッセージ編集をキャンセル
    cancelEditMessage(index, messageElement = null) {
      if (!messageElement) {
        messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
      }
      if (messageElement) {
        this.finishEditing(messageElement);
      } else if (state.editingMessageIndex === index) {
        state.editingMessageIndex = null;
        console.log("編集キャンセル: 要素が見つかりませんでしたがインデックスをリセット:", index);
      }
    },
    // 編集UIを終了する共通処理
    finishEditing(messageElement) {
      if (!messageElement) return;
      const editArea = messageElement.querySelector(".message-edit-area");
      const contentDiv = messageElement.querySelector(".message-content");
      const cascadeControls = messageElement.querySelector(".message-cascade-controls");
      messageElement.style.removeProperty("width");
      messageElement.classList.remove("editing");
      if (contentDiv) contentDiv.classList.remove("hidden");
      if (cascadeControls) cascadeControls.classList.remove("hidden");
      if (editArea) {
        editArea.classList.add("hidden");
        editArea.innerHTML = "";
      }
      const index = parseInt(messageElement.dataset.index, 10);
      if (state.editingMessageIndex === index) {
        state.editingMessageIndex = null;
        console.log("編集終了:", index);
      }
      elements.userInput.focus();
    },
    // メッセージを削除 (会話ターン全体)
    async deleteMessage(index) {
      if (state.editingMessageIndex === index) {
        this.cancelEditMessage(index);
      }
      if (state.isSending) {
        await uiUtils.showCustomAlert("送信中は削除できません。");
        return;
      }
      if (state.isEditingSystemPrompt) {
        await uiUtils.showCustomAlert("システムプロンプトを編集中は削除できません。");
        return;
      }
      if (index < 0 || index >= state.currentMessages.length) {
        console.error("削除対象のインデックスが無効:", index);
        return;
      }
      const messageToDelete = state.currentMessages[index];
      const messageContentPreview = messageToDelete.content.substring(0, 30) + "...";
      let confirmMessage = "";
      let deleteTargetDescription = "";
      let indicesToDelete = [];
      if (messageToDelete.role === "user") {
        indicesToDelete.push(index);
        confirmMessage = `メッセージ「${messageContentPreview}」を削除しますか？`;
        deleteTargetDescription = `単一メッセージ (index: ${index}, role: user)`;
        const nextMessageIndex = index + 1;
        if (nextMessageIndex < state.currentMessages.length && state.currentMessages[nextMessageIndex].role === "error") {
          indicesToDelete.push(nextMessageIndex);
          confirmMessage = `メッセージ「${messageContentPreview}」と、それに対するエラー応答を削除しますか？`;
          deleteTargetDescription = `メッセージペア (user at ${index}, error at ${nextMessageIndex})`;
        }
      } else if (messageToDelete.role === "model" && messageToDelete.isCascaded && messageToDelete.siblingGroupId) {
        const groupId = messageToDelete.siblingGroupId;
        const siblings = state.currentMessages.filter((msg) => msg.role === "model" && msg.isCascaded && msg.siblingGroupId === groupId);
        indicesToDelete = state.currentMessages.map((msg, i) => msg.role === "model" && msg.isCascaded && msg.siblingGroupId === groupId ? i : -1).filter((i) => i !== -1);
        confirmMessage = `「${messageContentPreview}」を含む応答グループ全体 (${siblings.length}件) を削除しますか？`;
        deleteTargetDescription = `カスケードグループ (gid: ${groupId}, ${indicesToDelete.length}件)`;
      } else {
        indicesToDelete.push(index);
        confirmMessage = `メッセージ「${messageContentPreview}」(${messageToDelete.role}) を削除しますか？`;
        deleteTargetDescription = `単一メッセージ (index: ${index}, role: ${messageToDelete.role})`;
      }
      const confirmed = await uiUtils.showCustomConfirm(confirmMessage);
      if (confirmed) {
        console.log(`削除実行: ${deleteTargetDescription}`);
        const originalFirstUserMsgIndex = state.currentMessages.findIndex((m) => m.role === "user");
        indicesToDelete.sort((a, b) => b - a).forEach((idx) => {
          state.currentMessages.splice(idx, 1);
        });
        console.log(`メッセージ削除完了 (state)。削除件数: ${indicesToDelete.length}`);
        const newFirstUserMsgIndex = state.currentMessages.findIndex((m) => m.role === "user");
        let requiresTitleUpdate = indicesToDelete.includes(originalFirstUserMsgIndex);
        try {
          uiUtils.renderChatMessages();
          let newTitleForSave = null;
          const currentChatData = state.currentChatId ? await dbUtils.getChat(state.currentChatId) : null;
          if (requiresTitleUpdate) {
            const newFirstUserMessage = newFirstUserMsgIndex !== -1 ? state.currentMessages[newFirstUserMsgIndex] : null;
            newTitleForSave = newFirstUserMessage ? newFirstUserMessage.content.substring(0, 50) : "無題のチャット";
          } else if (currentChatData) {
            newTitleForSave = currentChatData.title;
          }
          await dbUtils.saveChat(newTitleForSave);
          if (requiresTitleUpdate) {
            uiUtils.updateChatTitle(newTitleForSave);
          }
          if (state.currentMessages.length === 0 && !state.currentSystemPrompt && state.currentChatId) {
            console.log("チャットが空になったためリセットします。");
            this.startNewChat();
          }
          if (state.settings.autoScroll) {
            requestAnimationFrame(() => {
              this.scrollToBottom();
            });
          }
        } catch (error) {
          console.error("メッセージ削除後のチャット保存/取得エラー:", error);
          await uiUtils.showCustomAlert("メッセージ削除後のチャット保存に失敗しました。");
        }
      } else {
        console.log("削除キャンセル");
      }
    },
    async retryFromMessage(index) {
      if (state.isSending) {
        await uiUtils.showCustomAlert("送信中です。");
        return;
      }
      const userMessage = state.currentMessages[index];
      if (!userMessage || userMessage.role !== "user") return;
      const messageContentPreview = userMessage.content.substring(0, 30) + "...";
      const confirmed = await uiUtils.showCustomConfirm(`「${messageContentPreview}」から再生成しますか？
(これより未来の会話履歴は削除され、既存の応答は別候補として保持されます)`);
      if (confirmed) {
        uiUtils.setSendingState(true);
        let originalResponses = [];
        if (state.pendingCascadeResponses) {
          originalResponses = state.pendingCascadeResponses;
          console.log("保留中のカスケード応答を復元しました。");
        } else {
          const futureMessages = state.currentMessages.slice(index + 1);
          const firstModelResponse = futureMessages.find((msg) => msg.role === "model");
          if (firstModelResponse && firstModelResponse.isCascaded && firstModelResponse.siblingGroupId) {
            const groupId = firstModelResponse.siblingGroupId;
            originalResponses = state.currentMessages.filter(
              (msg) => msg.siblingGroupId === groupId
            );
          } else if (firstModelResponse) {
            originalResponses.push(firstModelResponse);
          }
        }
        state.pendingCascadeResponses = originalResponses;
        state.currentMessages.splice(index + 1);
        uiUtils.renderChatMessages();
        let modelMessage;
        try {
          const baseHistory = state.currentMessages.filter((msg) => !msg.isCascaded || msg.isSelected);
          const historyForApi = this._prepareApiHistory(baseHistory);
          modelMessage = { role: "model", content: "", timestamp: Date.now() };
          state.currentMessages.push(modelMessage);
          const modelMessageIndex = state.currentMessages.length - 1;
          uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);
          this.scrollToBottom();
          const generationConfig = {};
          if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
          if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
          if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
          if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
          if ((state.settings.apiProvider || "gemini") === "gemini" && (state.settings.thinkingBudget > 0 || state.settings.includeThoughts)) {
            generationConfig.thinkingConfig = {};
            if (state.settings.thinkingBudget > 0) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
            if (state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
          }
          const systemInstruction = state.currentSystemPrompt?.trim() ? { role: "system", parts: [{ text: state.currentSystemPrompt.trim() }] } : null;
          const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
          const newAggregatedMessage = this._aggregateMessages(newMessages);
          newAggregatedMessage.modelName = state.settings.modelName;
          const finalOriginalResponses = state.pendingCascadeResponses || [];
          state.pendingCascadeResponses = null;
          const siblingGroupId = finalOriginalResponses.length > 0 && finalOriginalResponses[0].siblingGroupId ? finalOriginalResponses[0].siblingGroupId : `gid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          finalOriginalResponses.forEach((msg) => {
            msg.isCascaded = true;
            msg.isSelected = false;
            msg.siblingGroupId = siblingGroupId;
          });
          newAggregatedMessage.executedFunctions = newAggregatedMessage.executedFunctions || [];
          newMessages.forEach((msg) => {
            if (msg.executedFunctions && Array.isArray(msg.executedFunctions)) {
              msg.executedFunctions.forEach((funcName) => {
                if (!newAggregatedMessage.executedFunctions.includes(funcName)) {
                  newAggregatedMessage.executedFunctions.push(funcName);
                }
              });
            }
            if (msg.role === "tool" && msg.name) {
              if (!newAggregatedMessage.executedFunctions.includes(msg.name)) {
                newAggregatedMessage.executedFunctions.push(msg.name);
              }
            }
          });
          newAggregatedMessage.isCascaded = true;
          newAggregatedMessage.isSelected = true;
          newAggregatedMessage.siblingGroupId = siblingGroupId;
          state.currentMessages.splice(modelMessageIndex, 1, ...finalOriginalResponses, newAggregatedMessage);
          uiUtils.renderChatMessages();
          this.scrollToBottom();
          await dbUtils.saveChat();
        } catch (error) {
          console.error("再生成エラー:", error);
          const errorMessage = error.name !== "AbortError" ? error.message || "不明なエラーが発生しました。" : "リクエストがキャンセルされました。";
          const placeholderIndex = state.currentMessages.findIndex((m) => m.timestamp === modelMessage.timestamp);
          if (placeholderIndex !== -1) {
            state.currentMessages.splice(placeholderIndex, 1);
          }
          await dbUtils.saveChat();
          state.currentMessages.push({ role: "error", content: errorMessage, timestamp: Date.now(), isNonPersistent: true });
          uiUtils.renderChatMessages();
          state.currentMessages = state.currentMessages.filter((m) => !m.isNonPersistent);
          this.scrollToBottom();
        } finally {
          uiUtils.setSendingState(false);
          state.abortController = null;
          if (state.settings.autoScroll) {
            requestAnimationFrame(() => {
              this.scrollToBottom();
            });
          }
        }
      }
    },
    // --- カスケード応答操作 ---
    getCascadedSiblings(index, includeSelf = false) {
      const targetMsg = state.currentMessages[index];
      if (!targetMsg || !targetMsg.isCascaded || !targetMsg.siblingGroupId) {
        return [];
      }
      const groupId = targetMsg.siblingGroupId;
      const siblings = state.currentMessages.filter(
        (msg, i) => msg.role === "model" && !msg.tool_calls && msg.isCascaded && msg.siblingGroupId === groupId && (includeSelf || i !== index)
      );
      return siblings;
    },
    async navigateCascade(currentIndex, direction) {
      const currentMsg = state.currentMessages[currentIndex];
      if (!currentMsg || !currentMsg.isCascaded || !currentMsg.siblingGroupId) return;
      const groupId = currentMsg.siblingGroupId;
      const siblingsWithIndices = state.currentMessages.map((msg, i) => ({ msg, originalIndex: i })).filter((item) => item.msg.siblingGroupId === groupId);
      if (siblingsWithIndices.length <= 1) return;
      const currentPosition = siblingsWithIndices.findIndex((item) => item.originalIndex === currentIndex);
      if (currentPosition === -1) return;
      let targetPosition = -1;
      if (direction === "prev" && currentPosition > 0) {
        targetPosition = currentPosition - 1;
      } else if (direction === "next" && currentPosition < siblingsWithIndices.length - 1) {
        targetPosition = currentPosition + 1;
      }
      if (targetPosition !== -1) {
        siblingsWithIndices.forEach((item) => {
          item.msg.isSelected = false;
        });
        const targetItem = siblingsWithIndices[targetPosition];
        targetItem.msg.isSelected = true;
        const newSelectedIndex = targetItem.originalIndex;
        uiUtils.renderChatMessages();
        requestAnimationFrame(() => {
          const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newSelectedIndex}"]`);
          if (elementToShowActions && !elementToShowActions.classList.contains("editing")) {
            const currentlyShown = elements.messageContainer.querySelector(".message.show-actions");
            if (currentlyShown && currentlyShown !== elementToShowActions) {
              currentlyShown.classList.remove("show-actions");
            }
            elementToShowActions.classList.add("show-actions");
          }
        });
        await dbUtils.saveChat();
      }
    },
    async confirmDeleteCascadeResponse(indexToDelete) {
      const msgToDelete = state.currentMessages[indexToDelete];
      if (!msgToDelete || msgToDelete.role !== "model" || !msgToDelete.isCascaded || !msgToDelete.siblingGroupId) {
        return;
      }
      if (state.editingMessageIndex !== null) {
        await uiUtils.showCustomAlert("編集中は削除できません。");
        return;
      }
      if (state.isSending) {
        await uiUtils.showCustomAlert("送信中は削除できません。");
        return;
      }
      if (state.isEditingSystemPrompt) {
        await uiUtils.showCustomAlert("システムプロンプト編集中は削除できません。");
        return;
      }
      const siblings = this.getCascadedSiblings(indexToDelete, true);
      const currentIndexInGroup = siblings.findIndex((m) => m === msgToDelete) + 1;
      const totalSiblings = siblings.length;
      const contentPreview = msgToDelete.content.substring(0, 30) + "...";
      const confirmMsg = `この応答 (${currentIndexInGroup}/${totalSiblings})「${contentPreview}」を削除しますか？
(この応答のみが削除されます)`;
      const confirmed = await uiUtils.showCustomConfirm(confirmMsg);
      if (confirmed) {
        const wasSelected = msgToDelete.isSelected;
        const groupId = msgToDelete.siblingGroupId;
        state.currentMessages.splice(indexToDelete, 1);
        let newlySelectedIndex = -1;
        const remainingSiblingsWithIndices = state.currentMessages.map((msg, i) => ({ msg, originalIndex: i })).filter((item) => item.msg.role === "model" && item.msg.isCascaded && item.msg.siblingGroupId === groupId);
        if (remainingSiblingsWithIndices.length > 0) {
          remainingSiblingsWithIndices.forEach((item) => {
            item.msg.isSelected = false;
          });
          if (wasSelected) {
            const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
            lastSiblingItem.msg.isSelected = true;
            newlySelectedIndex = lastSiblingItem.originalIndex;
          } else {
            const stillSelectedItem = remainingSiblingsWithIndices.find((item) => item.msg.isSelected);
            if (stillSelectedItem) {
              newlySelectedIndex = stillSelectedItem.originalIndex;
            } else {
              const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
              lastSiblingItem.msg.isSelected = true;
              newlySelectedIndex = lastSiblingItem.originalIndex;
            }
          }
        }
        uiUtils.renderChatMessages();
        requestAnimationFrame(() => {
          if (newlySelectedIndex !== -1) {
            const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newlySelectedIndex}"]`);
            if (elementToShowActions && !elementToShowActions.classList.contains("editing")) {
              const currentlyShown = elements.messageContainer.querySelector(".message.show-actions");
              if (currentlyShown && currentlyShown !== elementToShowActions) {
                currentlyShown.classList.remove("show-actions");
              }
              elementToShowActions.classList.add("show-actions");
            }
          }
        });
        try {
          await dbUtils.saveChat();
        } catch (error) {
          await uiUtils.showCustomAlert("応答削除後のチャット状態の保存に失敗しました。");
        }
      }
    },
    async callApiWithRetry(apiParams) {
      const { messagesForApi, generationConfig, systemInstruction, tools, isFirstCall } = apiParams;
      let lastError = null;
      const maxRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;
      const forceCalling = state.settings.forceFunctionCalling && isFirstCall;
      if (!state.abortController) {
        state.abortController = new AbortController();
      }
      const timeoutEnabled = state.settings.enableApiTimeout || false;
      const timeoutMs = timeoutEnabled ? (state.settings.apiTimeoutSeconds || 90) * 1e3 : null;
      if (timeoutEnabled) {
        console.log(`[Timeout] APIタイムアウト有効: ${timeoutMs}ms`);
      } else {
        console.log(`[Timeout] APIタイムアウト無効`);
      }
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const attemptController = new AbortController();
        const abortListener = /* @__PURE__ */ __name(() => attemptController.abort(), "abortListener");
        state.abortController.signal.addEventListener("abort", abortListener);
        let timeoutId = null;
        try {
          if (state.abortController?.signal.aborted) {
            throw new DOMException("リクエストがキャンセルされました。", "AbortError");
          }
          if (attempt > 0) {
            let delay;
            if (state.settings.useFixedRetryDelay) {
              delay = state.settings.fixedRetryDelaySeconds * 1e3;
            } else {
              const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
              const maxDelay = state.settings.maxBackoffDelaySeconds * 1e3;
              delay = Math.min(exponentialDelay, maxDelay);
            }
            uiUtils.setLoadingIndicatorText(`APIエラー 再試行(${attempt}回目)... ${Math.round(delay / 1e3)}秒待機`);
            console.log(`API呼び出し失敗。${delay}ms後にリトライします... (試行 ${attempt + 1}/${maxRetries + 1})`);
            await interruptibleSleep(delay, state.abortController.signal);
          }
          if (attempt === 1) {
            uiUtils.setLoadingIndicatorText("再試行中...");
          } else if (attempt > 1) {
            uiUtils.setLoadingIndicatorText(`${attempt}回目の再試行中...`);
          }
          const startTime = Date.now();
          if (timeoutEnabled && timeoutMs) {
            timeoutId = setTimeout(() => {
              const elapsed = Date.now() - startTime;
              console.warn(`[Timeout] API呼び出しが${elapsed}ms経過。タイムアウト(${timeoutMs}ms)により中断します。`);
              attemptController.abort();
            }, timeoutMs);
          }
          const response = await apiUtils.callApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, attemptController.signal);
          const getFinishReasonError = /* @__PURE__ */ __name((candidate2) => {
            const reason = candidate2?.finishReason;
            if (reason && reason !== "STOP" && reason !== "MAX_TOKENS") {
              const error = new Error(`モデルが応答をブロックしました (理由: ${reason})`);
              error.candidate = candidate2;
              return error;
            }
            return null;
          }, "getFinishReasonError");
          const checkForSafetyRejection = /* @__PURE__ */ __name((candidate2, content, toolCalls, images) => {
            if (content || toolCalls && toolCalls.length > 0 || images && images.length > 0) {
              return null;
            }
            const isNormalFinish = candidate2?.finishReason === "STOP" || candidate2?.finishReason === "MAX_TOKENS";
            const safetyRatings = candidate2?.safetyRatings;
            const hasHighRiskRating = safetyRatings && safetyRatings.some((r) => r.probability === "HIGH" || r.probability === "MEDIUM");
            if (isNormalFinish && hasHighRiskRating) {
              const highRiskCategories = safetyRatings.filter((r) => r.probability === "HIGH" || r.probability === "MEDIUM").map((r) => r.category.replace("HARM_CATEGORY_", "")).join(", ");
              return new Error(`モデルがコンテンツの生成を拒否しました (理由: ${highRiskCategories})。プロンプトを調整して再試行してください。`);
            }
            return null;
          }, "checkForSafetyRejection");
          const responseData = await response.json();
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
            const elapsed = Date.now() - startTime;
            console.log(`[API Call] レスポンス取得成功 (所要時間: ${elapsed}ms)`);
          }
          if (responseData.promptFeedback) {
            const blockReason = responseData.promptFeedback.blockReason || "SAFETY";
            throw new Error(`APIが応答をブロックしました (理由: ${blockReason})`);
          }
          if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("API応答に有効な候補(candidates)が含まれていません。プロンプトがブロックされた可能性があります。");
          }
          const candidate = responseData.candidates[0];
          const finishReasonError = getFinishReasonError(candidate);
          if (finishReasonError) throw finishReasonError;
          const parts = candidate.content?.parts || [];
          let finalContent = "";
          let finalThoughtSummary = "";
          let finalToolCalls = [];
          let finalThoughtParts = [];
          console.log("[Thinking Debug] candidate keys:", Object.keys(candidate));
          console.log("[Thinking Debug] parts count:", parts.length);
          parts.forEach((part, i) => {
            console.log(`[Thinking Debug] part[${i}] keys:`, Object.keys(part), "| thought:", part.thought, "| hasThoughtSig:", !!part.thoughtSignature, "| hasText:", !!part.text);
          });
          parts.forEach((part) => {
            if (part.thoughtSignature && part.functionCall) {
              finalThoughtParts.push(part);
              finalToolCalls.push({ functionCall: part.functionCall });
            } else if (part.thought && part.thought !== true) {
              finalThoughtParts.push(part);
            } else if (part.text) {
              if (part.thought === true) {
                finalThoughtSummary += part.text;
              } else {
                finalContent += part.text;
              }
            } else if (part.functionCall) {
              finalToolCalls.push({ functionCall: part.functionCall });
            }
          });
          if (candidate.thoughts?.parts) {
            candidate.thoughts.parts.forEach((part) => {
              if (part.text) {
                finalThoughtSummary += part.text;
              }
            });
          }
          const safetyError = checkForSafetyRejection(candidate, finalContent, finalToolCalls, []);
          if (safetyError) throw safetyError;
          if (!finalContent && finalToolCalls.length === 0) {
            throw new Error("APIから空の応答が返されました。");
          }
          return {
            content: finalContent,
            thoughtSummary: finalThoughtSummary.trim() || null,
            toolCalls: finalToolCalls.length > 0 ? finalToolCalls : null,
            thoughtParts: finalThoughtParts.length > 0 ? finalThoughtParts : null,
            // 追加
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings,
            usageMetadata: responseData.usageMetadata,
            retryCount: attempt
          };
        } catch (error) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          lastError = error;
          if (error.name === "AbortError" && attemptController.signal.aborted && !state.abortController?.signal.aborted) {
            const timeoutError = new Error(`APIタイムアウト: ${timeoutMs}ms以内にレスポンスが返りませんでした。`);
            timeoutError.isTimeout = true;
            lastError = timeoutError;
            console.warn(`[Timeout] タイムアウト検出。エラーとして扱い、リトライ機構に委ねます。`);
          }
          if (error.name === "AbortError" && state.abortController?.signal.aborted) {
            console.error("待機中または通信中に中断されました。リトライを中止します。", error);
            throw error;
          }
          if (error.status && error.status >= 400 && error.status < 500) {
            console.error(`リトライ不可のエラー (ステータス: ${error.status})。リトライを中止します。`, error);
            throw error;
          }
          console.warn(`API呼び出し/処理試行 ${attempt + 1} が失敗しました。`, error);
          if (error.candidate) {
            console.error("ブロックされた応答の詳細:", JSON.stringify(error.candidate, null, 2));
          }
        } finally {
          state.abortController.signal.removeEventListener("abort", abortListener);
        }
      }
      console.error("最大リトライ回数に達しました。最終的なエラーをスローします。");
      throw lastError;
    }
  };

  // src/mime-types.js
  var extensionToMimeTypeMap = {
    // Text Data
    pdf: "application/pdf",
    js: "text/javascript",
    py: "text/x-python",
    txt: "text/plain",
    html: "text/html",
    htm: "text/html",
    json: "application/json",
    css: "text/css",
    md: "text/markdown",
    csv: "text/csv",
    xml: "application/xml",
    rtf: "application/rtf",
    java: "text/x-java-source",
    c: "text/x-c",
    cpp: "text/x-c++src",
    hpp: "text/x-c++hdr",
    h: "text/x-chdr",
    cs: "text/plain",
    php: "application/x-httpd-php",
    rb: "text/x-ruby",
    go: "text/x-go",
    swift: "text/x-swift",
    kt: "text/x-kotlin",
    kts: "text/x-kotlin",
    rs: "text/rust",
    ts: "text/typescript",
    tsx: "text/typescript",
    sql: "application/sql",
    sh: "application/x-sh",
    yml: "text/yaml",
    yaml: "text/yaml",
    // Image Data
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    // Video Data
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    mov: "video/mov",
    avi: "video/avi",
    flv: "video/x-flv",
    mpg: "video/mpg",
    webm: "video/webm",
    wmv: "video/wmv",
    "3gp": "video/3gpp",
    "3gpp": "video/3gpp",
    // Audio Data
    wav: "audio/wav",
    mp3: "audio/mp3",
    aiff: "audio/aiff",
    aac: "audio/aac",
    ogg: "audio/ogg",
    flac: "audio/flac"
  };

  // src/app-logic/attachment.js
  var attachmentMethods = {
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(",")[1];
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },
    base64ToBlob(base64, mimeType) {
      return fetch(`data:${mimeType};base64,${base64}`).then((res) => res.blob());
    },
    _prepareApiHistory(baseMessages) {
      console.log("[API Prep] 履歴をAPIフォーマットに変換します。");
      const messagesForApi = JSON.parse(JSON.stringify(baseMessages));
      let historyToProcess;
      if (state.currentSummarizedContext && state.currentSummarizedContext.summaryText) {
        console.log("[API Prep] 要約コンテキストを検出。API履歴を圧縮します。");
        const { summaryText } = state.currentSummarizedContext;
        const headCount = 5;
        const tailCount = 15;
        const headMessages = messagesForApi.slice(0, headCount);
        const tailMessages = messagesForApi.slice(Math.max(headCount, messagesForApi.length - tailCount));
        const summaryMessage = {
          role: "user",
          content: `【これまでの会話の要約】
${summaryText}`,
          timestamp: Date.now(),
          isHidden: true,
          // UIには表示されない内部的なメッセージ
          attachments: []
        };
        historyToProcess = [...headMessages, summaryMessage, ...tailMessages];
        console.log(`[API Prep] 履歴を圧縮しました: Head(${headMessages.length}) + Summary(1) + Tail(${tailMessages.length}) = ${historyToProcess.length}件`);
      } else {
        historyToProcess = messagesForApi;
      }
      if (state.settings.dummyEnabled) {
        if (state.settings.reverseDummyOrder) {
          if (state.settings.dummyModel) {
            historyToProcess.push({ role: "model", content: state.settings.dummyModel, attachments: [] });
          }
          if (state.settings.dummyUser) {
            historyToProcess.push({ role: "user", content: state.settings.dummyUser, attachments: [] });
          }
        } else {
          if (state.settings.dummyUser) {
            historyToProcess.push({ role: "user", content: state.settings.dummyUser, attachments: [] });
          }
          if (state.settings.dummyModel) {
            historyToProcess.push({ role: "model", content: state.settings.dummyModel, attachments: [] });
          }
        }
      }
      return historyToProcess.map((msg) => {
        const parts = [];
        let contentText = msg.content || "";
        if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
          const fileNames = msg.attachments.map((att) => att.name).join(", ");
          const attachmentText = `

[添付ファイル: ${fileNames}]`;
          contentText = (contentText.trim() ? contentText : "") + attachmentText;
        }
        if (contentText.trim() !== "" || msg.isHidden) {
          parts.push({ text: contentText });
        }
        if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att) => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
        }
        if (msg.generated_images && msg.generated_images.length > 0) {
          msg.generated_images.forEach((img) => {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
          });
        }
        if (msg.role === "model" && msg.tool_calls) {
          msg.tool_calls.forEach((toolCall) => parts.push({ functionCall: toolCall.functionCall }));
        }
        if (msg.role === "tool") {
          if (msg.name && msg.response) {
            parts.push({
              functionResponse: {
                name: msg.name,
                response: msg.response,
                _toolCallId: msg._toolCallId || msg.tool_call_id
                // 元のtoolCallIdを保存
              }
            });
          }
        }
        return { role: msg.role === "tool" ? "tool" : msg.role === "model" ? "model" : "user", parts };
      }).filter((c) => c.parts.length > 0);
    },
    // -------------------------------
    // --- 背景画像ハンドラ ---
    async handleBackgroundImageUpload(file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        await uiUtils.showCustomAlert(`画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        await uiUtils.showCustomAlert("画像ファイルを選択してください (JPEG, PNG, GIF, WebPなど)");
        return;
      }
      try {
        const blob = file;
        state.settings.backgroundImageBlob = blob;
        await dbUtils.saveSetting("backgroundImageBlob", blob);
        uiUtils.applyBackgroundImage();
      } catch (error) {
        console.error("背景画像の保存・適用エラー:", error);
        state.settings.backgroundImageBlob = null;
        await dbUtils.saveSetting("backgroundImageBlob", null);
        uiUtils.applyBackgroundImage();
      }
    },
    // 背景画像削除の確認
    async confirmDeleteBackgroundImage() {
      const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
      if (confirmed) {
        await this.handleBackgroundImageDelete();
      }
    },
    // 背景画像削除処理
    async handleBackgroundImageDelete() {
      try {
        uiUtils.revokeExistingObjectUrl();
        await dbUtils.saveSetting("backgroundImageBlob", null);
        state.settings.backgroundImageBlob = null;
        state.isTemporaryBackgroundActive = false;
        elements.chatScreen.classList.remove("background-visible");
        document.documentElement.style.removeProperty("--chat-background-image");
        uiUtils.updateBackgroundSettingsUI();
      } catch (error) {
        console.error("背景画像削除エラー:", error);
        await uiUtils.showCustomAlert(`背景画像の削除中にエラーが発生しました: ${error}`);
      }
    },
    // --- ファイルアップロード関連ロジック ---
    async handleFileSelection(fileList) {
      if (!fileList || fileList.length === 0) return;
      const newFiles = Array.from(fileList);
      let addedCount = 0;
      const skippedFiles = {
        duplicate: [],
        size: [],
        totalSize: []
      };
      let currentTotalSize = state.selectedFilesForUpload.reduce((sum, item) => sum + item.file.size, 0);
      elements.selectFilesBtn.disabled = true;
      elements.selectFilesBtn.textContent = "処理中...";
      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          skippedFiles.size.push(file.name);
          continue;
        }
        if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
          skippedFiles.totalSize.push(file.name);
          continue;
        }
        const isDuplicate = state.selectedFilesForUpload.some(
          (existingItem) => existingItem.file.name === file.name && existingItem.file.size === file.size
        );
        if (isDuplicate) {
          skippedFiles.duplicate.push(file.name);
          continue;
        }
        state.selectedFilesForUpload.push({ file });
        currentTotalSize += file.size;
        addedCount++;
      }
      elements.selectFilesBtn.disabled = false;
      elements.selectFilesBtn.textContent = "ファイルを選択";
      let alertMessage = "";
      if (skippedFiles.duplicate.length > 0) {
        alertMessage += `以下のファイルは既に追加されているためスキップしました:
- ${skippedFiles.duplicate.join("\n- ")}

`;
      }
      if (skippedFiles.size.length > 0) {
        alertMessage += `以下のファイルはサイズが大きすぎるため(${formatFileSize(MAX_FILE_SIZE)}以下)スキップしました:
- ${skippedFiles.size.join("\n- ")}

`;
      }
      if (skippedFiles.totalSize.length > 0) {
        alertMessage += `合計サイズ上限(${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)})を超えるため、以下のファイルはスキップしました:
- ${skippedFiles.totalSize.join("\n- ")}

`;
      }
      if (alertMessage) {
        await uiUtils.showCustomAlert(alertMessage.trim());
      }
      uiUtils.updateSelectedFilesUI();
      console.log(`${addedCount}個のファイルが選択リストに新しく追加されました。`);
    },
    removeSelectedFile(indexToRemove) {
      if (indexToRemove >= 0 && indexToRemove < state.selectedFilesForUpload.length) {
        const removedFile = state.selectedFilesForUpload.splice(indexToRemove, 1)[0];
        console.log(`ファイル "${removedFile.file.name}" をリストから削除しました。`);
        uiUtils.updateSelectedFilesUI();
      }
    },
    async confirmAttachment() {
      if (state.selectedFilesForUpload.length === 0) {
        state.pendingAttachments = [];
        console.log("添付ファイルリストが空の状態で確定されました。送信待ちリストをクリアします。");
        elements.fileUploadDialog.close("ok");
        uiUtils.adjustTextareaHeight();
        uiUtils.updateAttachmentBadgeVisibility();
        return;
      }
      elements.confirmAttachBtn.disabled = true;
      elements.confirmAttachBtn.textContent = "処理中...";
      const attachmentsToAdd = [];
      let encodingError = false;
      for (const item of state.selectedFilesForUpload) {
        try {
          const base64Data = await this.fileToBase64(item.file);
          const rehydratedBlob = await this.base64ToBlob(base64Data, item.file.type);
          let browserMimeType = item.file.type || "";
          const fileName = item.file.name;
          const fileExtension = fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
          let guessedMimeType = null;
          if (fileExtension && extensionToMimeTypeMap[fileExtension]) {
            guessedMimeType = extensionToMimeTypeMap[fileExtension];
          }
          let finalMimeType;
          if (guessedMimeType) {
            finalMimeType = guessedMimeType;
            if (finalMimeType !== browserMimeType) {
              console.log(`ファイル "${fileName}": 拡張子(.${fileExtension})からMIMEタイプを "${finalMimeType}" に設定 (ブラウザ提供: ${browserMimeType || "空"})`);
            }
          } else if (browserMimeType) {
            finalMimeType = browserMimeType;
            console.log(`ファイル "${fileName}": ブラウザ提供のMIMEタイプ "${finalMimeType}" を使用します。(拡張子からの推測なし)`);
          } else {
            finalMimeType = "application/octet-stream";
            console.warn(`ファイル "${fileName}": MIMEタイプ不明。拡張子(.${fileExtension})にもマッピングなし。'application/octet-stream' を使用します。`);
          }
          const ANTHROPIC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          if (state.settings.apiProvider === "anthropic" && finalMimeType.startsWith("image/") && !ANTHROPIC_IMAGE_TYPES.includes(finalMimeType)) {
            encodingError = true;
            await uiUtils.showCustomAlert(`"${fileName}": ${finalMimeType} 形式の画像はAnthropicAPIに対応していません。
JPEG・PNG・GIF・WebP形式に変換してから添付してください。
※iPhoneのHEIC画像は、設定→カメラ→フォーマットを「互換性優先」に変更するか、変換アプリをご利用ください。`);
            break;
          }
          attachmentsToAdd.push({
            file: rehydratedBlob,
            name: fileName,
            mimeType: finalMimeType,
            base64Data
          });
        } catch (error) {
          console.error(`ファイル "${item.file.name}" のBase64エンコード中にエラー:`, error);
          encodingError = true;
          await uiUtils.showCustomAlert(`ファイル "${item.file.name}" の処理中にエラーが発生しました。`);
          break;
        }
      }
      elements.confirmAttachBtn.disabled = false;
      elements.confirmAttachBtn.textContent = "添付して閉じる";
      if (!encodingError) {
        state.pendingAttachments = attachmentsToAdd;
        console.log(`${state.pendingAttachments.length}件のファイルを添付準備完了:`, state.pendingAttachments.map((a) => `${a.name} (${a.mimeType})`));
        elements.fileUploadDialog.close("ok");
        uiUtils.adjustTextareaHeight();
        uiUtils.updateAttachmentBadgeVisibility();
      }
    },
    cancelAttachment() {
      state.selectedFilesForUpload = [];
      console.log("ファイル添付をキャンセルしました。");
      elements.fileUploadDialog.close("cancel");
      uiUtils.updateAttachmentBadgeVisibility();
    },
    /**
     * Function Callingから受け取ったURLを一時的な背景画像として適用する
     * @param {string} url - 画像のURL
     * @returns {Promise<object>} 処理結果
     */
    async applyBackgroundImageFromUrl(url) {
      if (!url || typeof url !== "string") {
        return { error: "画像URLが無効です。" };
      }
      console.log(`一時的な背景画像をURLから適用: ${url}`);
      uiUtils.revokeExistingObjectUrl();
      state.backgroundImageUrl = url;
      const chatScreen = elements.chatScreen;
      const isAlreadyVisible = chatScreen.classList.contains("background-visible");
      const switchImageAndFadeIn = /* @__PURE__ */ __name(() => {
        document.documentElement.style.setProperty("--chat-background-image", `url("${url}")`);
        chatScreen.classList.add("background-visible");
      }, "switchImageAndFadeIn");
      if (isAlreadyVisible) {
        chatScreen.addEventListener("transitionend", switchImageAndFadeIn, { once: true });
        chatScreen.classList.remove("background-visible");
      } else {
        switchImageAndFadeIn();
      }
      state.isTemporaryBackgroundActive = true;
      uiUtils.updateBackgroundSettingsUI();
      const message = `背景画像を一時的に変更しました。この変更はリロードするか、設定から背景を再設定すると元に戻ります。`;
      return { success: true, message };
    },
    async handleBackgroundImageUrl(url) {
      if (!url || typeof url !== "string") {
        return { error: "画像URLが無効です。" };
      }
      console.log(`背景画像をURLから取得開始: ${url}`);
      uiUtils.setLoadingIndicatorText("背景画像を取得中...");
      elements.loadingIndicator.classList.remove("hidden");
      try {
        const response = await fetch(url, { referrerPolicy: "no-referrer" });
        if (!response.ok) {
          throw new Error(`画像の取得に失敗しました (HTTPステータス: ${response.status})`);
        }
        const blob = await response.blob();
        const maxSize = 5 * 1024 * 1024;
        if (blob.size > maxSize) {
          return { error: `画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)` };
        }
        uiUtils.revokeExistingObjectUrl();
        await dbUtils.saveSetting("backgroundImageBlob", blob);
        state.settings.backgroundImageBlob = blob;
        state.backgroundImageUrl = URL.createObjectURL(blob);
        document.documentElement.style.setProperty("--chat-background-image", `url(${state.backgroundImageUrl})`);
        uiUtils.updateBackgroundSettingsUI();
        console.log("背景画像をURLから正常に更新しました。");
        return { success: true, message: "背景画像を更新しました。" };
      } catch (error) {
        console.error("背景画像のURLからの取得エラー:", error);
        if (error instanceof TypeError) {
          return { error: `画像の取得に失敗しました。指定されたURLのサーバーが外部からのアクセスを許可していない(CORSポリシー)可能性があります。` };
        }
        return { error: `画像の取得中にエラーが発生しました: ${error.message}` };
      } finally {
        elements.loadingIndicator.classList.add("hidden");
      }
    }
  };

  // src/utils/message-image.js
  var CAPTURE_EXCLUDED_CLASSES = /* @__PURE__ */ new Set([
    "message-actions",
    "message-cascade-controls",
    "message-edit-area"
  ]);
  var MAX_CANVAS_AREA = 16777216;
  var MAX_CANVAS_SIDE = 16384;
  var MIN_FIT_SCALE = 0.3;
  var CAPTURE_CLASS = "msg-capture-target";
  var CAPTURE_STYLE_ID = "__msg-capture-style";
  var CAPTURE_OVERRIDE_CSS = `
    .${CAPTURE_CLASS}, .${CAPTURE_CLASS} * {
        color: #1a1a1a !important;
        -webkit-text-fill-color: #1a1a1a !important;
        text-shadow: none !important;
        line-height: 1.6 !important;
    }
    .${CAPTURE_CLASS} {
        background: #ffffff !important;
        box-shadow: none !important;
        border: 1px solid #e0e0e0 !important;
        opacity: 1 !important;
    }
    .${CAPTURE_CLASS}.user { background: #eaf2f5 !important; }
    .${CAPTURE_CLASS} .message-content pre,
    .${CAPTURE_CLASS} .message-content code {
        background: #f3f3f3 !important;
        color: #1a1a1a !important;
        -webkit-text-fill-color: #1a1a1a !important;
        border-color: #dddddd !important;
    }
    .${CAPTURE_CLASS} .message-content a {
        color: #1565c0 !important;
        -webkit-text-fill-color: #1565c0 !important;
    }
    .${CAPTURE_CLASS} .message-content blockquote {
        color: #555555 !important;
        -webkit-text-fill-color: #555555 !important;
        border-left-color: #cccccc !important;
    }
    /* ターン番号/モデル名ラベル（::before）は薄いグレーに */
    .${CAPTURE_CLASS}::before, .${CAPTURE_CLASS} *::before {
        color: #888888 !important;
        -webkit-text-fill-color: #888888 !important;
        opacity: 1 !important;
    }
    /* 閉じている思考プロセス(details)の中身は画像に含めない（開いていれば含める） */
    .${CAPTURE_CLASS} details:not([open]) > *:not(summary) { display: none !important; }
`;
  function shouldExcludeFromCapture(element) {
    return [...CAPTURE_EXCLUDED_CLASSES].some(
      (className) => element.classList?.contains(className)
    );
  }
  __name(shouldExcludeFromCapture, "shouldExcludeFromCapture");
  function nextFrame() {
    return new Promise(
      (resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  }
  __name(nextFrame, "nextFrame");
  var captureStyleEl = null;
  function applyCaptureStyles(elements2) {
    if (!captureStyleEl) {
      captureStyleEl = document.createElement("style");
      captureStyleEl.id = CAPTURE_STYLE_ID;
      captureStyleEl.textContent = CAPTURE_OVERRIDE_CSS;
    }
    if (!captureStyleEl.isConnected) document.head.appendChild(captureStyleEl);
    for (const el of elements2) el.classList.add(CAPTURE_CLASS);
  }
  __name(applyCaptureStyles, "applyCaptureStyles");
  function removeCaptureStyles(elements2) {
    for (const el of elements2) el.classList.remove(CAPTURE_CLASS);
    if (captureStyleEl?.isConnected) captureStyleEl.remove();
  }
  __name(removeCaptureStyles, "removeCaptureStyles");
  function captureParams() {
    const backgroundColor = "#ffffff";
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    return { backgroundColor, scale };
  }
  __name(captureParams, "captureParams");
  async function ensureFontsReady() {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {
    }
  }
  __name(ensureFontsReady, "ensureFontsReady");
  async function captureElementToCanvas(messageElement, { backgroundColor, scale }) {
    return await html2canvas(messageElement, {
      backgroundColor,
      scale,
      useCORS: true,
      ignoreElements: /* @__PURE__ */ __name((element) => shouldExcludeFromCapture(element), "ignoreElements")
    });
  }
  __name(captureElementToCanvas, "captureElementToCanvas");
  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("PNGへの変換に失敗しました。")),
        "image/png"
      );
    });
  }
  __name(canvasToPngBlob, "canvasToPngBlob");
  function formatTimestamp(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
      "-",
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
      String(date.getSeconds()).padStart(2, "0")
    ].join("");
  }
  __name(formatTimestamp, "formatTimestamp");
  function createMessageImageFilename(messageElement, date = /* @__PURE__ */ new Date()) {
    const role = messageElement.classList.contains("user") ? "user" : "assistant";
    const turn = messageElement.dataset.turn || "message";
    return `PWA-lily_${turn}_${role}_${formatTimestamp(date)}.png`;
  }
  __name(createMessageImageFilename, "createMessageImageFilename");
  function createRangeImageFilename(date = /* @__PURE__ */ new Date(), part = 0, total = 1) {
    const suffix = total > 1 ? `_${part}of${total}` : "";
    return `PWA-lily_range_${formatTimestamp(date)}${suffix}.png`;
  }
  __name(createRangeImageFilename, "createRangeImageFilename");
  async function messageElementToPngBlob(messageElement) {
    if (!(messageElement instanceof HTMLElement)) {
      throw new TypeError("保存対象のメッセージが見つかりません。");
    }
    if (typeof html2canvas === "undefined") {
      throw new Error("画像生成ライブラリ（html2canvas）が読み込まれていません。ページを再読み込みしてください。");
    }
    const rect = messageElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error("表示されていないメッセージは画像にできません。");
    }
    await ensureFontsReady();
    applyCaptureStyles([messageElement]);
    try {
      await nextFrame();
      const canvas = await captureElementToCanvas(messageElement, captureParams());
      return await canvasToPngBlob(canvas);
    } finally {
      removeCaptureStyles([messageElement]);
    }
  }
  __name(messageElementToPngBlob, "messageElementToPngBlob");
  async function messagesRangeToPngBlobs(messageElements) {
    if (typeof html2canvas === "undefined") {
      throw new Error("画像生成ライブラリ（html2canvas）が読み込まれていません。ページを再読み込みしてください。");
    }
    const targets = [...messageElements].filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (targets.length === 0) {
      throw new Error("表示されているメッセージがありません。");
    }
    const { backgroundColor, scale } = captureParams();
    await ensureFontsReady();
    const captures = [];
    applyCaptureStyles(targets);
    try {
      await nextFrame();
      for (const element of targets) {
        const canvas = await captureElementToCanvas(element, { backgroundColor, scale });
        captures.push({ canvas, isUser: element.classList.contains("user") });
      }
    } finally {
      removeCaptureStyles(targets);
    }
    const gap = Math.round(12 * scale);
    const totalWidth = Math.max(...captures.map((i) => i.canvas.width));
    const totalHeight = captures.reduce((sum, i) => sum + i.canvas.height, 0) + gap * (captures.length - 1);
    const fit = Math.min(
      1,
      MAX_CANVAS_SIDE / totalWidth,
      MAX_CANVAS_SIDE / totalHeight,
      Math.sqrt(MAX_CANVAS_AREA / (totalWidth * totalHeight))
    );
    if (fit >= MIN_FIT_SCALE) {
      return [await canvasToPngBlob(combineCanvases(captures, backgroundColor, gap, fit))];
    }
    const maxChunkHeight = Math.min(MAX_CANVAS_SIDE, Math.floor(MAX_CANVAS_AREA / totalWidth));
    const chunks = [];
    let current = [];
    let currentHeight = 0;
    for (const item of captures) {
      const add = item.canvas.height + (current.length ? gap : 0);
      if (current.length && currentHeight + add > maxChunkHeight) {
        chunks.push(current);
        current = [];
        currentHeight = 0;
      }
      current.push(item);
      currentHeight += item.canvas.height + (current.length > 1 ? gap : 0);
    }
    if (current.length) chunks.push(current);
    const blobs = [];
    for (const chunk of chunks) {
      blobs.push(await canvasToPngBlob(combineCanvases(chunk, backgroundColor, gap, 1)));
    }
    return blobs;
  }
  __name(messagesRangeToPngBlobs, "messagesRangeToPngBlobs");
  function combineCanvases(items, backgroundColor, gap, fit = 1) {
    const logicalWidth = Math.max(...items.map((i) => i.canvas.width));
    const logicalHeight = items.reduce((sum, i) => sum + i.canvas.height, 0) + gap * (items.length - 1);
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.floor(logicalWidth * fit));
    out.height = Math.max(1, Math.floor(logicalHeight * fit));
    const ctx = out.getContext("2d");
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, out.width, out.height);
    let y = 0;
    for (const item of items) {
      const cw = item.canvas.width;
      const ch = item.canvas.height;
      const x = item.isUser ? Math.max(0, logicalWidth - cw) : 0;
      ctx.drawImage(
        item.canvas,
        0,
        0,
        cw,
        ch,
        Math.round(x * fit),
        Math.round(y * fit),
        Math.round(cw * fit),
        Math.round(ch * fit)
      );
      y += ch + gap;
    }
    return out;
  }
  __name(combineCanvases, "combineCanvases");

  // src/app-logic/media.js
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  __name(triggerDownload, "triggerDownload");
  var mediaMethods = {
    // ===== 範囲画像保存（複数メッセージをまとめて画像化） =====
    // フローティングパネルの「範囲を画像保存」から呼ばれ、選択モードに入る。
    enterRangeImageMode() {
      state.rangeImageSelect = { active: true, startIndex: null, endIndex: null };
      elements.messageContainer?.classList.add("range-select-mode");
      uiUtils.updateRangeImageSelectionUI();
    },
    exitRangeImageMode() {
      state.rangeImageSelect = { active: false, startIndex: null, endIndex: null };
      elements.messageContainer?.classList.remove("range-select-mode");
      uiUtils.clearRangeImageHighlight();
      uiUtils.updateRangeImageSelectionUI();
    },
    // 選択モード中にメッセージがタップされたときの処理。
    // 1タップ目=始点。2タップ目以降は終点を更新し、範囲を伸縮できる
    // （始点を変えたい場合はキャンセルしてやり直す）。表示上の前後関係は
    // 描画時に min/max で正規化する。
    handleRangeMessageSelect(index) {
      const sel = state.rangeImageSelect;
      if (!sel.active) return;
      if (sel.startIndex === null) {
        sel.startIndex = index;
        sel.endIndex = null;
      } else {
        sel.endIndex = index;
      }
      uiUtils.updateRangeImageSelectionUI();
    },
    // 確認バーの「保存」から呼ばれる。
    async confirmRangeImageSave() {
      const sel = state.rangeImageSelect;
      if (!sel.active || sel.startIndex === null) return;
      const start = sel.startIndex;
      const end = sel.endIndex === null ? sel.startIndex : sel.endIndex;
      try {
        await this.saveMessagesRangeAsImage(start, end);
        this.exitRangeImageMode();
      } catch (error) {
        console.error("範囲画像の保存に失敗:", error);
        await uiUtils.showCustomAlert(`範囲画像の保存に失敗しました。
${error.message}`);
      }
    },
    // start..end のメッセージ要素をまとめて画像化して保存する。
    // 複数枚に分割された場合は JSZip でまとめて1ファイル（zip）としてダウンロード。
    async saveMessagesRangeAsImage(startIndex, endIndex) {
      const [a, b] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const container = elements.messageContainer;
      const elementsInRange = [];
      for (let i = a; i <= b; i++) {
        const el = container?.querySelector(`.message[data-index="${i}"]`);
        if (el) elementsInRange.push(el);
      }
      if (elementsInRange.length === 0) {
        throw new Error("保存対象のメッセージが見つかりません。");
      }
      const blobs = await messagesRangeToPngBlobs(elementsInRange);
      const now = /* @__PURE__ */ new Date();
      if (blobs.length === 1) {
        triggerDownload(blobs[0], createRangeImageFilename(now));
        return;
      }
      if (typeof JSZip === "undefined") {
        blobs.forEach((blob, idx) => triggerDownload(blob, createRangeImageFilename(now, idx + 1, blobs.length)));
        return;
      }
      const zip = new JSZip();
      blobs.forEach((blob, idx) => {
        zip.file(createRangeImageFilename(now, idx + 1, blobs.length), blob);
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `PWA-lily_range_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.zip`);
    },
    /**
     * 画像Blobを受け取り、WebPに変換してimage_storeに保存し、新しいIDを返す
     * @param {Blob} blob - 保存対象の画像Blob
     * @returns {Promise<string>} 保存された画像のユニークID
     */
    async saveImageBlob(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(async (webpBlob) => {
              if (!webpBlob) {
                console.warn("WebPへの変換に失敗しました。元の形式で保存します。");
                webpBlob = blob;
              }
              const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              const imageData = {
                id: imageId,
                blob: webpBlob,
                width: img.naturalWidth,
                // 幅を追加
                height: img.naturalHeight,
                // 高さを追加
                createdAt: /* @__PURE__ */ new Date()
              };
              try {
                await dbUtils.openDB();
                const store = dbUtils._getStore(IMAGE_STORE, "readwrite");
                const request = store.put(imageData);
                request.onsuccess = () => resolve(imageId);
                request.onerror = (event) => reject(event.target.error);
              } catch (dbError) {
                reject(dbError);
              }
            }, "image/webp", 0.9);
          };
          img.onerror = () => reject(new Error("画像データの読み込みに失敗しました。"));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("FileReaderでBlobの読み込みに失敗しました。"));
        reader.readAsDataURL(blob);
      });
    },
    imageObserver: null,
    /**
     * IDを指定してimage_storeから画像Blobを取得する
     * @param {string} id - 取得する画像のID
     * @returns {Promise<Blob|null>} 画像のBlobオブジェクト、またはnull
     */
    async getImageBlobById(id) {
      try {
        await dbUtils.openDB();
        const store = dbUtils._getStore(IMAGE_STORE, "readonly");
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = (event) => {
            resolve(event.target.result || null);
          };
          request.onerror = (event) => reject(event.target.error);
        });
      } catch (error) {
        console.error(`ID(${id})の画像Blob取得エラー:`, error);
        return null;
      }
    },
    /**
     * 古い形式の画像データ（チャット履歴埋め込み）を新しいimage_storeに移行する
     * @param {IDBTransaction} transaction - onupgradeneededから渡されるトランザクション
     */
    async migrateImageData() {
      console.log("[DB Migration] v11データ移行処理のチェックを開始します...");
      try {
        const migrationFlag = await dbUtils.getSetting("v11_migration_complete");
        if (migrationFlag && migrationFlag.value) {
          console.log("[DB Migration] v11データ移行は既に完了しています。");
          return;
        }
        console.log("[DB Migration] v11データ移行を開始します...");
        const allChats = await dbUtils.getAllChats();
        let migratedImageCount = 0;
        for (const chat of allChats) {
          let chatModified = false;
          if (!chat.messages) continue;
          for (const message of chat.messages) {
            if (message.generated_images && message.generated_images.length > 0) {
              message.imageIds = message.imageIds || [];
              for (const imgData of message.generated_images) {
                try {
                  const imageBlob = await this.base64ToBlob(imgData.data, imgData.mimeType);
                  const newImageId = await this.saveImageBlob(imageBlob);
                  message.imageIds.push(newImageId);
                  migratedImageCount++;
                } catch (error) {
                  console.error(`[DB Migration] チャット(id:${chat.id})の画像移行中にエラー:`, error);
                }
              }
              delete message.generated_images;
              chatModified = true;
            }
          }
          if (chatModified) {
            console.log(`[DB Migration] チャット(id:${chat.id})を更新します。`);
            await dbUtils.saveChat(chat.title, chat);
          }
        }
        console.log(`[DB Migration] v11データ移行が完了しました。合計 ${migratedImageCount} 枚の画像を移行しました。`);
        await dbUtils.saveSetting("v11_migration_complete", true);
      } catch (error) {
        console.error("[DB Migration] v11データ移行処理中に致命的なエラーが発生しました:", error);
      }
    },
    updateAssetCount: /* @__PURE__ */ __name(async function() {
      try {
        const assets = await dbUtils.getAllAssets();
        elements.assetCountDisplay.textContent = `現在 ${assets.length} 枚のアセットが保存されています。`;
      } catch (error) {
        console.error("アセット数の更新に失敗:", error);
        elements.assetCountDisplay.textContent = "アセット数の取得に失敗しました。";
      }
    }, "updateAssetCount"),
    convertBlobToWebP: /* @__PURE__ */ __name(function(originalBlob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((webpBlob) => {
              if (webpBlob) {
                console.log(`[WebP Converter] 変換成功: ${originalBlob.size} bytes -> ${webpBlob.size} bytes`);
                resolve(webpBlob);
              } else {
                console.warn("[WebP Converter] WebPへの変換に失敗。元の形式を使用します。");
                resolve(originalBlob);
              }
            }, "image/webp", 0.9);
          };
          img.onerror = () => {
            console.error("[WebP Converter] 画像データの読み込み失敗。");
            resolve(originalBlob);
          };
          img.src = e.target.result;
        };
        reader.onerror = () => {
          console.error("[WebP Converter] FileReader失敗。");
          resolve(originalBlob);
        };
        reader.readAsDataURL(originalBlob);
      });
    }, "convertBlobToWebP"),
    handleAssetExport: /* @__PURE__ */ __name(async function() {
      uiUtils.showProgressDialog("エクスポート準備中...");
      try {
        const assets = await dbUtils.getAllAssets();
        if (assets.length === 0) {
          uiUtils.hideProgressDialog();
          return uiUtils.showCustomAlert("エクスポートするアセットがありません。");
        }
        uiUtils.updateProgressMessage("Zipファイルを生成中...");
        const zip = new JSZip();
        const manifest = [];
        const usedFileNames = /* @__PURE__ */ new Set();
        const sanitizeFileName = /* @__PURE__ */ __name((name) => {
          return name.replace(/[\\/:*?"<>|]/g, "_");
        }, "sanitizeFileName");
        for (const asset of assets) {
          let baseName = sanitizeFileName(asset.name);
          let fileName = `${baseName}.webp`;
          let count = 1;
          while (usedFileNames.has(fileName)) {
            count++;
            fileName = `${baseName}_${count}`;
          }
          usedFileNames.add(fileName);
          manifest.push({ asset_name: asset.name, file_name: fileName });
          zip.file(fileName, asset.blob);
        }
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));
        const content = await zip.generateAsync({ type: "blob" });
        uiUtils.updateProgressMessage("ファイルをダウンロード中...");
        const a = document.createElement("a");
        const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
        a.download = `Gemini_PWA_Assets_${date}.zip`;
        a.href = URL.createObjectURL(content);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch (error) {
        console.error("アセットのエクスポートに失敗:", error);
        await uiUtils.showCustomAlert(`エクスポート中にエラーが発生しました: ${error.message}`);
      } finally {
        uiUtils.hideProgressDialog();
      }
    }, "handleAssetExport"),
    handleAssetImport: /* @__PURE__ */ __name(async function(file) {
      if (!file) return;
      if (typeof JSZip === "undefined") {
        return uiUtils.showCustomAlert("Zip処理ライブラリが読み込まれていません。");
      }
      uiUtils.showProgressDialog("Zipファイルを展開中...");
      console.log(`[Import] インポート処理開始: ${file.name}`);
      try {
        const zip = await JSZip.loadAsync(file);
        const manifestFileEntry = Object.values(zip.files).find(
          (entry) => !entry.dir && entry.name.endsWith("manifest.json")
        );
        const assetsToImport = [];
        const assetNameMap = /* @__PURE__ */ new Map();
        if (manifestFileEntry) {
          console.log(`[Import] ${manifestFileEntry.name} を発見。通常モードで処理します。`);
          try {
            const manifest = JSON.parse(await manifestFileEntry.async("string"));
            manifest.forEach((item) => assetNameMap.set(item.file_name, item.asset_name));
            console.log(`[Import] manifestから ${assetNameMap.size} 件のアセット定義を読み込みました。`);
          } catch (e) {
            console.error("[Import] manifest.jsonのパースに失敗しました。", e);
            await uiUtils.showCustomAlert("manifest.jsonの形式が正しくありません。簡易モードで続行します。");
          }
        } else {
          console.log("[Import] manifest.jsonが見つかりません。簡易モードで処理します。");
        }
        const imageFilePromises = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && /\.(webp|png|jpe?g|gif)$/i.test(relativePath)) {
            const baseName = relativePath.split("/").pop();
            const assetName = assetNameMap.get(baseName) || baseName.replace(/\.[^/.]+$/, "");
            console.log(`[Import] ファイルを発見: '${relativePath}' -> アセット名: '${assetName}'`);
            imageFilePromises.push({ name: assetName, file: zipEntry });
          }
        });
        assetsToImport.push(...imageFilePromises);
        if (assetsToImport.length === 0) {
          uiUtils.hideProgressDialog();
          return uiUtils.showCustomAlert("Zipファイル内にインポート可能な画像が見つかりませんでした。");
        }
        console.log(`[Import] ${assetsToImport.length}件のインポート対象画像をリストアップしました。`);
        let conflictChoice = null;
        let applyToAll = false;
        let importedCount = 0;
        for (let i = 0; i < assetsToImport.length; i++) {
          const item = assetsToImport[i];
          let assetName = item.name;
          uiUtils.updateProgressMessage(`アセットを処理中 (${i + 1}/${assetsToImport.length}): ${assetName}`);
          const existingAsset = await dbUtils.getAsset(assetName);
          if (existingAsset) {
            console.log(`[Import] 競合を検出: アセット「${assetName}」は既に存在します。`);
            if (!applyToAll) {
              uiUtils.hideProgressDialog();
              const userDecision = await this.showAssetConflictDialog(assetName);
              uiUtils.showProgressDialog(`アセットを処理中 (${i + 1}/${assetsToImport.length}): ${assetName}`);
              conflictChoice = userDecision.choice;
              applyToAll = userDecision.applyToAll;
              console.log(`[Import] ユーザーの選択: ${conflictChoice}, 全てに適用: ${applyToAll}`);
            }
            if (conflictChoice === "skip") {
              console.log(`[Import] 「${assetName}」をスキップしました。`);
              continue;
            }
            if (conflictChoice === "rename") {
              let newName;
              let count = 2;
              do {
                newName = `${assetName} (${count})`;
                count++;
              } while (await dbUtils.getAsset(newName));
              console.log(`[Import] 「${assetName}」の名前を「${newName}」に変更しました。`);
              assetName = newName;
            }
          }
          const blob = await item.file.async("blob");
          const webpBlob = await this.convertBlobToWebP(blob);
          await dbUtils.saveAsset({ name: assetName, blob: webpBlob, createdAt: /* @__PURE__ */ new Date() });
          console.log(`[Import] アセット「${assetName}」をDBに保存しました。`);
          importedCount++;
        }
        uiUtils.hideProgressDialog();
        await uiUtils.showCustomAlert(`${importedCount}件のアセットのインポート処理が完了しました。`);
        await this.updateAssetCount();
        if (importedCount > 0) {
          this.markAsDirtyAndSchedulePush(true);
        }
      } catch (error) {
        console.error("アセットのインポートに失敗:", error);
        await uiUtils.showCustomAlert(`インポート中にエラーが発生しました: ${error.message}`);
      } finally {
        uiUtils.hideProgressDialog();
      }
    }, "handleAssetImport"),
    async openAssetManagementDialog() {
      try {
        const assets = await dbUtils.getAllAssets();
        const container = elements.assetListContainer;
        container.innerHTML = "";
        if (assets.length === 0) {
          container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">保存されているアセットはありません。</p>';
          elements.assetManagementDialog.showModal();
          return;
        }
        const objectUrls = [];
        assets.forEach((asset) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = "asset-item";
          const url = URL.createObjectURL(asset.blob);
          objectUrls.push(url);
          const thumbnail = document.createElement("img");
          thumbnail.className = "asset-thumbnail";
          thumbnail.src = url;
          thumbnail.alt = asset.name;
          const infoDiv = document.createElement("div");
          infoDiv.className = "asset-info";
          const nameSpan = document.createElement("span");
          nameSpan.className = "asset-name";
          nameSpan.textContent = asset.name;
          nameSpan.title = asset.name;
          const detailsSpan = document.createElement("span");
          detailsSpan.className = "asset-details";
          const createdDate = new Date(asset.createdAt).toLocaleString("ja-JP");
          detailsSpan.textContent = `追加日: ${createdDate}`;
          infoDiv.appendChild(nameSpan);
          infoDiv.appendChild(detailsSpan);
          const actionsDiv = document.createElement("div");
          actionsDiv.className = "asset-actions-item";
          const deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
          deleteBtn.title = "削除";
          deleteBtn.onclick = () => this.confirmDeleteAsset(asset.name);
          actionsDiv.appendChild(deleteBtn);
          itemDiv.appendChild(thumbnail);
          itemDiv.appendChild(infoDiv);
          itemDiv.appendChild(actionsDiv);
          container.appendChild(itemDiv);
        });
        elements.assetManagementDialog.addEventListener("close", () => {
          objectUrls.forEach((url) => URL.revokeObjectURL(url));
          console.log(`${objectUrls.length}個のアセット用オブジェクトURLを解放しました。`);
        }, { once: true });
        elements.assetManagementDialog.showModal();
      } catch (error) {
        console.error("アセット管理ダイアログの表示に失敗:", error);
        await uiUtils.showCustomAlert("アセットの読み込みに失敗しました。");
      }
    },
    // --- Character Profile Dialog Functions ---
    updateCharacterProfileButtonVisibility() {
      const memory = state.currentPersistentMemory || {};
      const hasCharacterData = Object.keys(memory).some((key) => key.startsWith("character_memory_"));
      elements.characterProfileBtn.disabled = !hasCharacterData;
      if (!hasCharacterData) {
        elements.characterProfileBtn.title = "キャラクターデータがありません";
      } else {
        elements.characterProfileBtn.title = "キャラクタープロファイル";
      }
    },
    async openCharacterProfileDialog() {
      const memory = state.currentPersistentMemory || {};
      const characterKeys = Object.keys(memory).filter((key) => key.startsWith("character_memory_"));
      if (characterKeys.length === 0) return;
      elements.characterProfileDialog.classList.remove("details-visible");
      state.characterProfileVisibleCharacter = null;
      elements.characterDetailPane.innerHTML = "";
      const listContainer = elements.characterListPane;
      listContainer.innerHTML = "";
      const characterNames = characterKeys.map((key) => key.replace("character_memory_", ""));
      characterNames.forEach((name) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "profile-character-item";
        itemDiv.textContent = name;
        itemDiv.dataset.characterName = name;
        itemDiv.onclick = () => {
          this.renderCharacterDetails(name);
          if (window.innerWidth < 600) {
            elements.characterProfileDialog.classList.add("details-visible");
          }
        };
        listContainer.appendChild(itemDiv);
      });
      if (window.innerWidth >= 600) {
        this.renderCharacterDetails(characterNames[0]);
      }
      elements.characterProfileDialog.showModal();
    },
    renderCharacterDetails(characterName) {
      state.characterProfileVisibleCharacter = characterName;
      document.querySelectorAll(".profile-character-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.characterName === characterName);
      });
      const detailPane = elements.characterDetailPane;
      const memoryKey = `character_memory_${characterName}`;
      const data = state.currentPersistentMemory[memoryKey] || {};
      const createFieldUpdater = /* @__PURE__ */ __name((fieldPath) => {
        return (event) => {
          const newValue = event.target.value;
          this.handleProfileFieldUpdate(characterName, fieldPath, newValue);
        };
      }, "createFieldUpdater");
      detailPane.innerHTML = `
            <div class="profile-detail-section">
                <label for="profile-status">状態</label>
                <input type="text" id="profile-status" value="${htmlUtils.escapeAttr(data.status || "")}">
            </div>
            <div class="profile-detail-section">
                <label for="profile-location">現在地</label>
                <input type="text" id="profile-location" value="${htmlUtils.escapeAttr(data.current_location || "")}">
            </div>
            <div class="profile-detail-section">
                <label for="profile-summary">概要</label>
                <textarea id="profile-summary">${htmlUtils.escapeHtml(data.summary || "")}</textarea>
            </div>
            <div class="profile-detail-section">
                <label for="profile-goal">短期目標</label>
                <textarea id="profile-goal">${htmlUtils.escapeHtml(data.short_term_goal || "")}</textarea>
            </div>
            <div class="profile-detail-section">
                <div class="profile-detail-section-header">
                    <label>他キャラクターとの関係</label>
                    <button id="add-relationship-btn" class="add-relationship-btn">＋ 追加</button>
                </div>
                <div id="profile-relationships-grid" class="profile-relationships-grid">
                    ${Object.keys(data.relationships || {}).map((targetName, index) => {
        const escapedNameHtml = htmlUtils.escapeHtml(targetName);
        const escapedContext = htmlUtils.escapeHtml(data.relationships[targetName].context || "");
        const affinity = data.relationships[targetName].affinity || 0;
        return `
                        <div class="profile-relationship-card" data-rel-index="${index}">
                            <div class="profile-relationship-card-header">
                                <h5>${escapedNameHtml}</h5>
                                <button class="delete-relationship-btn" data-target-name="${htmlUtils.escapeAttr(targetName)}" title="この関係性を削除">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                            <label for="affinity-${index}">親密度</label>
                            <input type="number" id="affinity-${index}" value="${affinity}">
                            <label for="context-${index}" style="margin-top:10px;">関係性の文脈</label>
                            <textarea id="context-${index}">${escapedContext}</textarea>
                        </div>
                        `;
      }).join("")}
                </div>
            </div>
            <div class="profile-detail-section profile-delete-character-section">
                <button id="delete-character-btn" class="delete-character-btn">
                    <span class="material-symbols-outlined">person_remove</span>
                    このキャラクターを削除
                </button>
            </div>
        `;
      detailPane.querySelector("#profile-status").addEventListener("blur", createFieldUpdater(["status"]));
      detailPane.querySelector("#profile-location").addEventListener("blur", createFieldUpdater(["current_location"]));
      detailPane.querySelector("#profile-summary").addEventListener("blur", createFieldUpdater(["summary"]));
      detailPane.querySelector("#profile-goal").addEventListener("blur", createFieldUpdater(["short_term_goal"]));
      detailPane.querySelector("#add-relationship-btn").addEventListener("click", () => this.addRelationship(characterName));
      detailPane.querySelector("#delete-character-btn").addEventListener("click", () => this.confirmDeleteCharacter(characterName));
      Object.keys(data.relationships || {}).forEach((targetName, index) => {
        const card = detailPane.querySelector(`.profile-relationship-card[data-rel-index="${index}"]`);
        if (!card) {
          console.warn(`関係性カードが見つかりません: index=${index}, name=${targetName}`);
          return;
        }
        card.querySelector(`#affinity-${index}`).addEventListener("blur", createFieldUpdater(["relationships", targetName, "affinity"]));
        card.querySelector(`#context-${index}`).addEventListener("blur", createFieldUpdater(["relationships", targetName, "context"]));
        card.querySelector(".delete-relationship-btn").addEventListener("click", (e) => {
          const targetNameFromBtn = e.currentTarget.dataset.targetName;
          this.deleteRelationship(characterName, targetNameFromBtn);
        });
      });
    },
    async handleProfileFieldUpdate(characterName, fieldPath, newValue) {
      const memoryKey = `character_memory_${characterName}`;
      const memory = state.currentPersistentMemory[memoryKey];
      if (!memory) return;
      let current = memory;
      for (let i = 0; i < fieldPath.length - 1; i++) {
        current = current[fieldPath[i]];
      }
      const finalKey = fieldPath[fieldPath.length - 1];
      if (finalKey === "affinity") {
        newValue = parseInt(newValue, 10) || 0;
      }
      if (current[finalKey] === newValue) return;
      console.log(`Updating profile for ${characterName}: ${fieldPath.join(".")} = ${newValue}`);
      current[finalKey] = newValue;
      try {
        await dbUtils.saveChat();
      } catch (error) {
        console.error("キャラクタープロファイルの自動保存に失敗:", error);
      }
    },
    async addRelationship(characterName) {
      const targetName = await uiUtils.showCustomPrompt("関係を追加する相手のキャラクター名を入力してください:");
      if (!targetName || !targetName.trim()) return;
      const memoryKey = `character_memory_${characterName}`;
      const memory = state.currentPersistentMemory[memoryKey];
      if (!memory) return;
      if (!memory.relationships) memory.relationships = {};
      if (memory.relationships[targetName]) {
        await uiUtils.showCustomAlert(`キャラクター「${targetName}」との関係は既に存在します。`);
        return;
      }
      memory.relationships[targetName] = { affinity: 0, context: "" };
      try {
        await dbUtils.saveChat();
        this.renderCharacterDetails(characterName);
      } catch (error) {
        console.error("関係性の追加に失敗:", error);
      }
    },
    async deleteRelationship(characterName, targetName) {
      const confirmed = await uiUtils.showCustomConfirm(`「${characterName}」から「${targetName}」への関係性を削除しますか？`);
      if (!confirmed) return;
      const memoryKey = `character_memory_${characterName}`;
      const memory = state.currentPersistentMemory[memoryKey];
      if (memory && memory.relationships && memory.relationships[targetName]) {
        delete memory.relationships[targetName];
        try {
          await dbUtils.saveChat();
          this.renderCharacterDetails(characterName);
        } catch (error) {
          console.error("関係性の削除に失敗:", error);
        }
      }
    },
    async confirmDeleteCharacter(characterName) {
      const confirmed = await uiUtils.showCustomConfirm(`キャラクター「${characterName}」のすべてのデータを削除しますか？
この操作は元に戻せません。`);
      if (!confirmed) return;
      const normalizedCharName = window.normalizeCharacterName(characterName);
      let keyToDelete = null;
      for (const key in state.currentPersistentMemory) {
        if (key.startsWith("character_memory_")) {
          const existingName = key.replace("character_memory_", "");
          if (window.normalizeCharacterName(existingName) === normalizedCharName) {
            keyToDelete = key;
            break;
          }
        }
      }
      if (keyToDelete && state.currentPersistentMemory[keyToDelete]) {
        delete state.currentPersistentMemory[keyToDelete];
        try {
          await dbUtils.saveChat();
          console.log(`キャラクター「${characterName}」のデータを削除しました。`);
          this.openCharacterProfileDialog();
          this.updateCharacterProfileButtonVisibility();
        } catch (error) {
          console.error("キャラクターデータの削除に失敗:", error);
          await uiUtils.showCustomAlert("キャラクターデータの削除に失敗しました。");
        }
      } else {
        console.warn(`削除対象のキャラクター「${characterName}」が見つかりませんでした。`);
      }
    },
    async confirmDeleteAsset(assetName) {
      const confirmed = await uiUtils.showCustomConfirm(`アセット「${assetName}」を削除しますか？
この操作は元に戻せません。`);
      if (confirmed) {
        try {
          await dbUtils.deleteAsset(assetName);
          console.log(`アセット「${assetName}」を削除しました。`);
          this.openAssetManagementDialog();
          this.updateAssetCount();
        } catch (error) {
          console.error(`アセット「${assetName}」の削除に失敗:`, error);
          await uiUtils.showCustomAlert("アセットの削除に失敗しました。");
        }
      }
    },
    async confirmDeleteAllAssets() {
      const assets = await dbUtils.getAllAssets();
      if (assets.length === 0) {
        await uiUtils.showCustomAlert("削除するアセットはありません。");
        return;
      }
      const confirmed = await uiUtils.showCustomConfirm(`保存されている ${assets.length} 個のすべてのアセットを削除しますか？
この操作は元に戻せません。`);
      if (confirmed) {
        try {
          await new Promise((resolve, reject) => {
            const request = state.db.transaction("image_assets", "readwrite").objectStore("image_assets").clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          console.log("すべてのアセットを削除しました。");
          try {
            const activeChats = await dbUtils.getAllChats();
            const activeImageIds = /* @__PURE__ */ new Set();
            (activeChats || []).forEach((chat) => {
              (chat.messages || []).forEach((msg) => {
                (msg.imageIds || []).forEach((id) => activeImageIds.add(id));
              });
            });
            await new Promise((resolve, reject) => {
              const tx = state.db.transaction(IMAGE_STORE, "readwrite");
              const store = tx.objectStore(IMAGE_STORE);
              const getAllKeysReq = store.getAllKeys();
              getAllKeysReq.onsuccess = () => {
                const keys = getAllKeysReq.result || [];
                const orphanIds = keys.filter((id) => !activeImageIds.has(id));
                orphanIds.forEach((id) => store.delete(id));
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
              };
              getAllKeysReq.onerror = () => reject(getAllKeysReq.error);
            });
            console.log("image_store の孤児Blobをクリーンアップしました。");
          } catch (cleanupErr) {
            console.warn("image_store クリーンアップ中にエラー:", cleanupErr);
          }
          this.openAssetManagementDialog();
          this.updateAssetCount();
        } catch (error) {
          console.error("すべてのアセットの削除に失敗:", error);
          await uiUtils.showCustomAlert("すべてのアセットの削除に失敗しました。");
        }
      }
    },
    showAssetConflictDialog: /* @__PURE__ */ __name(function(assetName) {
      return new Promise((resolve) => {
        const dialog = elements.assetConflictDialog;
        elements.assetConflictMessage.textContent = `アセット「${assetName}」は既に存在します。どうしますか？`;
        elements.assetConflictApplyAll.checked = false;
        const actionArea = dialog.querySelector(".dialog-actions-main");
        const listener = /* @__PURE__ */ __name((event) => {
          const button = event.target.closest("button");
          if (!button) return;
          const choice = button.value;
          if (choice) {
            dialog.close();
            actionArea.removeEventListener("click", listener);
            resolve({
              choice,
              applyToAll: elements.assetConflictApplyAll.checked
            });
          }
        }, "listener");
        const oldListener = actionArea._listener;
        if (oldListener) {
          actionArea.removeEventListener("click", oldListener);
        }
        actionArea.addEventListener("click", listener);
        actionArea._listener = listener;
        dialog.showModal();
      });
    }, "showAssetConflictDialog"),
    // --- Stable Diffusion連携機能の本体ロジック ---
    handleStableDiffusionGeneration: /* @__PURE__ */ __name(async function(args, responseText = "") {
      if (!state.settings.sdApiUrl) {
        return { error: "Stable Diffusion WebUIのURLが設定されていません。" };
      }
      let currentPrompt = args.prompt;
      let generatedImageBlob = null;
      let qualityCheckResult = null;
      const isQcEnabled = state.settings.sdEnableQualityChecker;
      const maxRetries = isQcEnabled ? state.settings.sdQcRetries || 0 : 0;
      try {
        for (let i = 0; i <= maxRetries; i++) {
          if (i > 0) {
            uiUtils.setLoadingIndicatorText(`プロンプト改善中... (${i}/${maxRetries})`);
            currentPrompt = await this._improveSdPrompt(args.prompt, currentPrompt, qualityCheckResult.reason);
          }
          uiUtils.setLoadingIndicatorText("SDで画像生成中...");
          const payload = { ...args, prompt: currentPrompt };
          generatedImageBlob = await this.callStableDiffusionApi(payload);
          if (!isQcEnabled) {
            break;
          }
          uiUtils.setLoadingIndicatorText("品質チェック中...");
          qualityCheckResult = await this.runQualityChecker(generatedImageBlob, currentPrompt, responseText);
          console.log(`[Quality Check Cycle ${i + 1}/${maxRetries + 1}] 判定: ${qualityCheckResult.result}。理由: ${qualityCheckResult.reason || "N/A"}`);
          if (qualityCheckResult.result === "OK") {
            break;
          } else {
            if (i >= maxRetries) {
              throw new Error(`品質チェックが上限回数(${maxRetries}回)に達しました。最後のNG理由: ${qualityCheckResult.reason}`);
            }
          }
        }
        const imageId = await this.saveImageBlob(generatedImageBlob);
        return {
          success: true,
          message: "Stable Diffusionによる画像の生成と保存に成功しました。",
          _internal_ui_action: {
            type: "display_generated_images",
            imageIds: [imageId]
          },
          meta: { ...args, finalPrompt: currentPrompt, qualityCheckResult }
        };
      } catch (error) {
        console.error("[Stable Diffusion] 画像生成プロセスでエラー:", error);
        return { success: false, error: { message: `画像生成エラー: ${error.message}` } };
      }
    }, "handleStableDiffusionGeneration"),
    async _improveSdPrompt(originalPrompt, failedPrompt, ngReason) {
      const model = state.settings.sdPromptImproveModel;
      const systemPrompt = state.settings.sdPromptImproveSystemPrompt;
      const userPrompt = `元のプロンプト: ${originalPrompt}
失敗したプロンプト: ${failedPrompt}
失敗理由: ${ngReason}`;
      const requestBody = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.5 }
      };
      const endpoint = `${GEMINI_API_BASE_URL}${model}:generateContent`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": state.settings.apiKey },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error(`プロンプト改善APIエラー (${response.status})`);
      const data = await response.json();
      const improvedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!improvedPrompt) throw new Error("プロンプト改善APIから有効な応答が得られませんでした。");
      console.log("[SD Prompt Improver] 改善されたプロンプト:", improvedPrompt);
      return improvedPrompt;
    },
    callStableDiffusionApi: /* @__PURE__ */ __name(async function(args) {
      const apiUrl = state.settings.sdApiUrl.trim().replace(/\/$/, "");
      const endpoint = `${apiUrl}/sdapi/v1/txt2img`;
      const { advanced_params, ...mainArgs } = args;
      const payload = {
        negative_prompt: "",
        seed: -1,
        steps: 25,
        cfg_scale: 7,
        width: 1024,
        height: 1024,
        ...mainArgs,
        ...advanced_params
      };
      if (!payload.prompt) {
        throw new Error("必須パラメータ 'prompt' が指定されていません。");
      }
      if (payload.enable_hr === true && payload.denoising_strength === void 0) {
        payload.denoising_strength = 0.7;
        console.log("[Stable Diffusion] Hires. fixが有効ですがdenoising_strengthが未指定のため、デフォルト値の0.7を設定しました。");
      }
      if (payload.sd_model_checkpoint) {
        if (!payload.override_settings) {
          payload.override_settings = {};
        }
        if (!payload.override_settings.sd_model_checkpoint) {
          payload.override_settings.sd_model_checkpoint = payload.sd_model_checkpoint;
        }
        delete payload.sd_model_checkpoint;
      }
      const headers = { "Content-Type": "application/json" };
      if (state.settings.sdApiUser && state.settings.sdApiPassword) {
        headers["Authorization"] = "Basic " + btoa(`${state.settings.sdApiUser}:${state.settings.sdApiPassword}`);
      }
      console.log("[Stable Diffusion] APIリクエスト送信:", endpoint, payload);
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let errorMsg = `APIエラー (${response.status})`;
        try {
          const errorJson = await response.json();
          errorMsg += `: ${errorJson.detail || JSON.stringify(errorJson)}`;
        } catch (e) {
        }
        throw new Error(errorMsg);
      }
      const result = await response.json();
      if (!result.images || result.images.length === 0) {
        throw new Error("APIからの応答に画像データが含まれていませんでした。");
      }
      const base64Image = result.images[0];
      return await this.base64ToBlob(base64Image, "image/png");
    }, "callStableDiffusionApi"),
    handleNovelAIGeneration: /* @__PURE__ */ __name(async function(args) {
      if (!state.settings.novelaiApiKey) {
        return { error: "NovelAI APIトークンが設定されていません。設定画面で追加してください。" };
      }
      try {
        uiUtils.setLoadingIndicatorText("NovelAIで画像生成中...");
        const imageBlob = await this.callNovelAIApi(args);
        const imageId = await this.saveImageBlob(imageBlob);
        return {
          success: true,
          message: "NovelAIによる画像の生成と保存に成功しました。",
          _internal_ui_action: { type: "display_generated_images", imageIds: [imageId] }
        };
      } catch (error) {
        console.error("[NovelAI] 画像生成エラー:", error);
        const msg = error.message || String(error);
        await uiUtils.showCustomAlert(`NovelAI画像生成エラー:
${msg}`);
        return { success: false, error: { message: `NovelAI画像生成エラー: ${msg}` } };
      }
    }, "handleNovelAIGeneration"),
    callNovelAIApi: /* @__PURE__ */ __name(async function(args) {
      const endpoint = "https://image.novelai.net/ai/generate-image";
      const model = state.settings.novelaiModel || "nai-diffusion-4-5-curated";
      const isV4 = model.includes("4");
      const qualityPrefix = "{{masterpiece}}, {{best quality}}, {{highres}}, extremely detailed, anime style 2026, vibrant colors, sharp lines, highly detailed, 8k, ultra-detailed, intricate details, professional, detailed skin texture, individual hair strands, realistic cloth folds, glistening sweat droplets, volumetric lighting, cinematic lighting, rim light, dramatic shadows, atmospheric, beautiful face, detailed eyes with glossy highlights";
      const finalPrompt = args.prompt ? `${qualityPrefix}, ${args.prompt}` : qualityPrefix;
      const negPrompt = args.negative_prompt || "worst quality, lowres, blurry, deformed, ugly, mutated hands, extra limbs, poorly drawn face, bad anatomy, watermark, text, signature";
      const payload = {
        input: finalPrompt,
        model,
        action: "generate",
        parameters: {
          params_version: isV4 ? 3 : 1,
          width: args.width || 832,
          height: args.height || 1216,
          scale: 5,
          sampler: "k_euler_ancestral",
          steps: 28,
          n_samples: 1,
          ucPreset: 0,
          qualityToggle: isV4 ? true : false,
          sm: false,
          sm_dyn: false,
          dynamic_thresholding: false,
          cfg_rescale: 0,
          noise_schedule: isV4 ? "karras" : "native",
          legacy: false,
          legacy_v3_extend: false,
          negative_prompt: negPrompt,
          seed: Math.floor(Math.random() * 4294967295),
          reference_image_multiple: [],
          reference_strength_multiple: [],
          ...isV4 ? {
            v4_prompt: {
              caption: { base_caption: finalPrompt, char_captions: [] },
              use_coords: false,
              use_order: true
            },
            v4_negative_prompt: {
              caption: { base_caption: negPrompt, char_captions: [] },
              use_coords: false,
              use_order: true
            },
            characterPrompts: [],
            prefer_brownian: true,
            deliberate_euler_ancestral_bug: false,
            add_original_image: true,
            reference_information_extracted_multiple: []
          } : {}
        }
      };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.settings.novelaiApiKey}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let errorMsg = `NovelAI APIエラー (${response.status})`;
        try {
          const j = await response.json();
          errorMsg += `: ${j.message || JSON.stringify(j)}`;
        } catch {
        }
        throw new Error(errorMsg);
      }
      const zipBlob = await response.blob();
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const zip = await window.JSZip.loadAsync(zipBlob);
      const files = Object.values(zip.files).filter((f) => !f.dir);
      if (files.length === 0) throw new Error("ZIPファイルに画像が見つかりませんでした。");
      return await files[0].async("blob");
    }, "callNovelAIApi"),
    runQualityChecker: /* @__PURE__ */ __name(async function(imageBlob, prompt, responseText = "") {
      const qcModel = state.settings.sdQcModel;
      const qcSystemPrompt = state.settings.sdQcPrompt.replace("{prompt}", prompt || "(プロンプトなし)").replace("{response_text}", responseText || "(応答文なし)");
      const imageBase64 = await this.fileToBase64(imageBlob);
      const requestBody = {
        contents: [{
          parts: [
            { text: qcSystemPrompt },
            { inlineData: { mimeType: "image/png", data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      };
      const endpoint = `${GEMINI_API_BASE_URL}${qcModel}:generateContent`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": state.settings.apiKey },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        throw new Error(`品質チェックAPIエラー (${response.status})`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text.includes("Result: OK")) {
        return { result: "OK", reason: "" };
      } else {
        const reasonMatch = text.match(/Reason:\s*(.*)/);
        return { result: "NG", reason: reasonMatch ? reasonMatch[1] : "理由不明" };
      }
    }, "runQualityChecker")
  };

  // src/app-logic/memory.js
  var memoryMethods = {
    /**
     * @private 現在の永続メモリから状況サマリーを生成するヘルパー関数
     * @returns {string} AI向けのマークダウン形式のサマリー文字列
     */
    _buildSummaryForPrompt() {
      const memory = state.currentPersistentMemory || {};
      if (Object.keys(memory).length === 0) {
        return "";
      }
      let summary = "【現在の状況サマリー】\n";
      const sections = [];
      const characterMemoryEntries = Object.entries(memory).filter(([key]) => key.startsWith("character_memory_"));
      if (characterMemoryEntries.length > 0) {
        let content = characterMemoryEntries.map(([key, value]) => {
          const charName = key.replace("character_memory_", "");
          return `■ ${charName}
` + JSON.stringify(value, null, 2);
        }).join("\n");
        sections.push(`## キャラクター記憶 (manage_character_memory)
${content}`);
      }
      if (memory.scene_stack && memory.scene_stack.length > 0) {
        const currentScene = memory.scene_stack[memory.scene_stack.length - 1];
        let content = Object.entries(currentScene).map(([key, value]) => `- ${key}: ${value}`).join("\n");
        sections.push(`## シーン (manage_scene)
${content}`);
      }
      if (typeof memory.game_day === "number") {
        sections.push(`## 日付 (manage_game_date)
- 現在: ${memory.game_day}日目`);
      }
      const statusEntries = Object.entries(memory).filter(([key]) => key.startsWith("character_") && !key.startsWith("character_memory_"));
      if (statusEntries.length > 0) {
        let content = statusEntries.map(([key, value]) => {
          const charName = key.replace("character_", "");
          const statuses = Object.entries(value).map(([sKey, sValue]) => `${sKey}: ${sValue}`).join(", ");
          return `- ${charName}: ${statuses}`;
        }).join("\n");
        sections.push(`## 主要ステータス (manage_character_status)
${content}`);
      }
      if (memory.inventories && Object.keys(memory.inventories).length > 0) {
        let content = Object.entries(memory.inventories).map(([charName, items]) => {
          const itemList = Object.entries(items).map(([itemName, qty]) => `${itemName}(${qty})`).join(", ");
          return `- ${charName}: ${itemList}`;
        }).join("\n");
        sections.push(`## 所持品 (manage_inventory)
${content}`);
      }
      if (memory.style_profiles && Object.keys(memory.style_profiles).length > 0) {
        let content = Object.entries(memory.style_profiles).map(([charName, profile]) => {
          const profileDetails = Object.entries(profile).map(([key, value]) => `${key}: ${value}`).join(", ");
          return `- ${charName}: ${profileDetails}`;
        }).join("\n");
        sections.push(`## 口調設定 (manage_style_profile)
${content}`);
      }
      const knownKeys = /* @__PURE__ */ new Set(["scene_stack", "game_day", "inventories", "style_profiles"]);
      const flagAndMemoryKeys = Object.keys(memory).filter(
        (key) => !key.startsWith("character_") && !knownKeys.has(key)
      );
      if (flagAndMemoryKeys.length > 0) {
        let flagContent = flagAndMemoryKeys.map((key) => `- ${key}: ${JSON.stringify(memory[key])}`).join("\n");
        sections.push(`## フラグ・重要設定 (manage_flags, manage_persistent_memory)
${flagContent}`);
      }
      if (sections.length > 0) {
        summary += sections.join("\n\n");
        return summary;
      }
      return "";
    },
    // --- Memory Feature ---
    toggleMemoryOptions(isEnabled) {
      elements.memoryOptionsContainer.classList.toggle("hidden", !isEnabled);
      this.toggleMemoryIconVisibility();
    },
    toggleMemoryIconVisibility() {
      const isMasterEnabled = state.settings.enableMemory;
      elements.memoryToggleBtn.classList.toggle("hidden", !isMasterEnabled);
      if (isMasterEnabled) {
        elements.memoryToggleBtn.classList.toggle("active", state.isMemoryEnabledForChat);
      }
    },
    async toggleChatMemory() {
      state.isMemoryEnabledForChat = !state.isMemoryEnabledForChat;
      this.toggleMemoryIconVisibility();
      if (state.currentChatId) {
        try {
          await dbUtils.saveChat();
        } catch (error) {
          console.error("チャットごとのメモリ設定の保存に失敗:", error);
        }
      }
    },
    async openMemoryManagementDialog() {
      if (!state.activeProfileId) return;
      try {
        const memoryData = await dbUtils.getMemory(state.activeProfileId);
        this.renderMemoryList(memoryData ? memoryData.items : []);
        elements.memoryManagementDialog.showModal();
      } catch (error) {
        console.error("記憶管理ダイアログの表示に失敗:", error);
        await uiUtils.showCustomAlert("記憶の読み込みに失敗しました。");
      }
    },
    renderMemoryList(memoryItems) {
      elements.memoryListContainer.innerHTML = "";
      if (!memoryItems || memoryItems.length === 0) {
        elements.memoryListContainer.innerHTML = '<p class="no-memory-message">記憶されている項目はありません。</p>';
        return;
      }
      memoryItems.forEach((item, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "memory-item";
        const textSpan = document.createElement("span");
        textSpan.className = "memory-item-text";
        textSpan.textContent = item;
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "memory-item-actions";
        const editBtn = document.createElement("button");
        editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        editBtn.title = "編集";
        editBtn.onclick = () => this.editMemoryItem(index);
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteBtn.title = "削除";
        deleteBtn.onclick = () => this.deleteMemoryItem(index);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        itemDiv.appendChild(textSpan);
        itemDiv.appendChild(actionsDiv);
        elements.memoryListContainer.appendChild(itemDiv);
      });
    },
    async addMemoryItem() {
      const newItem = elements.newMemoryInput.value.trim();
      if (!newItem) return;
      try {
        const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
        memoryData.items.push(newItem);
        await dbUtils.saveMemory(state.activeProfileId, memoryData);
        this.markAsDirtyAndSchedulePush(true);
        this.renderMemoryList(memoryData.items);
        elements.newMemoryInput.value = "";
      } catch (error) {
        console.error("記憶の追加に失敗:", error);
        await uiUtils.showCustomAlert("記憶の追加に失敗しました。");
      }
    },
    async editMemoryItem(index) {
      try {
        const memoryData = await dbUtils.getMemory(state.activeProfileId);
        if (!memoryData || !memoryData.items || !memoryData.items[index]) return;
        const currentItem = memoryData.items[index];
        const newItem = await uiUtils.showCustomPrompt("記憶を編集:", currentItem);
        if (newItem && newItem.trim() !== currentItem) {
          memoryData.items[index] = newItem.trim();
          await dbUtils.saveMemory(state.activeProfileId, memoryData);
          this.markAsDirtyAndSchedulePush(true);
          this.renderMemoryList(memoryData.items);
        }
      } catch (error) {
        console.error("記憶の編集に失敗:", error);
        await uiUtils.showCustomAlert("記憶の編集に失敗しました。");
      }
    },
    async deleteMemoryItem(index) {
      try {
        const memoryData = await dbUtils.getMemory(state.activeProfileId);
        if (!memoryData || !memoryData.items || !memoryData.items[index]) return;
        const itemToDelete = memoryData.items[index];
        const confirmed = await uiUtils.showCustomConfirm(`以下の記憶を削除しますか？

「${itemToDelete}」`);
        if (confirmed) {
          memoryData.items.splice(index, 1);
          await dbUtils.saveMemory(state.activeProfileId, memoryData);
          this.markAsDirtyAndSchedulePush(true);
          this.renderMemoryList(memoryData.items);
        }
      } catch (error) {
        console.error("記憶の削除に失敗:", error);
        await uiUtils.showCustomAlert("記憶の削除に失敗しました。");
      }
    },
    async confirmDeleteAllMemory() {
      const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
      if (memoryData.items.length === 0) {
        await uiUtils.showCustomAlert("削除する記憶はありません。");
        return;
      }
      const confirmed = await uiUtils.showCustomConfirm(`現在プロファイルに保存されている ${memoryData.items.length} 件の記憶をすべて削除しますか？
この操作は元に戻せません。`);
      if (confirmed) {
        try {
          await dbUtils.saveMemory(state.activeProfileId, { items: [] });
          this.markAsDirtyAndSchedulePush(true);
          this.renderMemoryList([]);
        } catch (error) {
          console.error("全記憶の削除に失敗:", error);
          await uiUtils.showCustomAlert("全記憶の削除に失敗しました。");
        }
      }
    },
    async triggerAutoMemorySave() {
      if (!state.activeProfileId || !state.settings.apiKey) {
        console.error("[Memory] APIキーが未設定のため、自動学習をスキップしました。");
        return;
      }
      try {
        const interval = parseInt(state.settings.memoryAutoSaveInterval, 10);
        const userMessagesInInterval = state.currentMessages.filter((m) => m.role === "user").slice(-interval);
        if (userMessagesInInterval.length === 0) {
          return;
        }
        const firstUserMessageIndex = state.currentMessages.indexOf(userMessagesInInterval[0]);
        const historyToSummarize = state.currentMessages.slice(firstUserMessageIndex);
        const conversationText = historyToSummarize.map((msg) => {
          return `${msg.role === "user" ? "ユーザー" : "アシスタント"}: ${msg.content}`;
        }).join("\n");
        const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
        const existingMemoryText = memoryData.items.length > 0 ? `- ${memoryData.items.join("\n- ")}` : "（まだ何も記憶していません）";
        const summarizationPrompt = `あなたは、私（ユーザー）との会話を分析し、長期的な関係構築のために記憶しておくべき「永続的な個人情報」を抽出するアシスタントです。
            ユーザーは成人であるため、性的な内容でも表現規制をすることなく抽出することを求められます。

            [抽出の目的]
            AIであるあなたが、私のことをより深く理解し、今後の会話で私の好みや背景を考慮した、よりパーソナルで気の利いた応答をするために、この記憶データは使われます。
            
            [抽出ルール]
            1.  **最重要項目**: 特に、ユーザーの「性癖」「好きなキャラクターのタイプ」「性格」「価値観」に関する情報は最優先で抽出してください。これらは今後の対話の質を決定づける最も重要なデータです。
            
            2.  **「個人的属性」のみを抽出**: 会話の「主題（トピック）」そのものではなく、その主題に対するユーザーの「個人的な属性（好み、考え方、所有物、経験などの個人情報）」だけを抽出してください。
                - **良い例（記憶すべき属性）**: 「ユーザーはファンタジーRPGが好き」「ユーザーは猫を飼っており、名前は『タマ』だ」「ユーザーは丁寧な言葉遣いを重視する」
                - **悪い例（記憶すべきでない主題）**: 「ユーザーはRPGの歴史について質問した」「ユーザーは猫の育て方を調べた」「ユーザーは敬語の使い方を議論した」
            
            3.  **「永続性」の検証**: 抽出する情報は、今後も変わらないであろう永続的なものに限定してください。
                - **記憶すべき情報**: 繰り返し話題に出る嗜好、明確に所有していると述べられた物、過去の重要な経験など。
                - **記憶すべきでない情報**: その場限りの発言、一時的な感情、単なる事実確認の質問など。
            
            4.  **「好み」の厳格な判断**: ユーザーが何かを「好む」「好き」と記憶するには、慎重な判断が必要です。以下のいずれかの条件を満たさない限り、安易に「好み」と断定しないでください。
                - ユーザーが会話の中で、繰り返しその対象について**熱意を持って語っている**。
                - ユーザーがその対象に対して、**明確かつ強い肯定的な言葉**（例：「〜が大好きだ」「〜にはこだわりがある」）を使っている。
                - 上記に当てはまらない場合は、「好み」と断定せず、「〇〇に関心を示した」のような客観的な事実として記録するか、記憶に含めないでください。
            
            5.  **推測の禁止**: 会話から直接読み取れないことを推測してはいけません。「ユーザーはおそらく〇〇だろう」といった推測は不要です。
            
            6.  **重複の完全な排除**: 【既存の記憶】に少しでも関連する内容が既にある場合は、絶対に含めないでください。
            
            7.  **出力形式の厳守**:
                - 抽出した内容は、「ユーザーは〇〇を所有している」「ユーザーは〇〇という考えを持っている」のように、必ず**三人称の客観的な事実**として記述してください。
                - **AIとしての応答（「承知しました」など）や前置き、後書きは一切含めず**、抽出した箇条書きのリスト、または \`[追加情報なし]\` という文字列のみを出力してください。

            ---
            【既存の記憶】
            ${existingMemoryText}
            ---
            【会話履歴】
            ${conversationText}
            ---

            [抽出結果]`;
        const modelForMemory = "gemini-2.5-flash";
        const endpoint = `${GEMINI_API_BASE_URL}${modelForMemory}:generateContent`;
        const requestBody = {
          contents: [{
            role: "user",
            parts: [{ text: summarizationPrompt }]
          }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": state.settings.apiKey },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || `HTTPエラー: ${response.status}`;
          throw new Error(errorMessage);
        }
        const responseData = await response.json();
        const summaryText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summaryText) {
          console.warn("[Memory] 自動学習による要約結果が空でした。");
          return;
        }
        if (summaryText.trim() === "[追加情報なし]") {
          console.log("[Memory] AIが追加情報なしと判断したため、メモリの更新をスキップしました。");
          return;
        }
        const newItems = summaryText.split("\n").map((line) => line.replace(/^[*-]\s*/, "").trim()).filter((line) => line.length > 0 && line !== "[追加情報なし]");
        if (newItems.length > 0) {
          const existingItems = new Set(memoryData.items);
          const uniqueNewItems = newItems.filter((item) => !existingItems.has(item));
          if (uniqueNewItems.length > 0) {
            memoryData.items.push(...uniqueNewItems);
            await dbUtils.saveMemory(state.activeProfileId, memoryData);
            console.log(`[Memory] 自動学習により、${uniqueNewItems.length}件の新しい記憶を追加しました。`, uniqueNewItems);
          } else {
            console.log("[Memory] 自動学習で生成された記憶は、すべて既存のものでした。");
          }
        }
      } catch (error) {
        console.error("[Memory] 自動学習プロセスの実行中にエラーが発生しました:", error);
      }
    },
    updateSummarizeButtonState() {
      const messageCount = state.currentMessages.length;
      elements.summarizeHistoryBtn.disabled = messageCount < 5;
    },
    showChatStats() {
      const MODEL_PRICING = {
        // Claude 4系 (claude-opus-4-x, claude-sonnet-4-x, claude-haiku-4-x)
        "claude-opus-4-8": { in: 5, out: 25, cw5m: 6.25, cw1h: 10, cr: 0.5 },
        "claude-opus-4-7": { in: 5, out: 25, cw5m: 6.25, cw1h: 10, cr: 0.5 },
        "claude-opus-4-6": { in: 5, out: 25, cw5m: 6.25, cw1h: 10, cr: 0.5 },
        "claude-opus-4-5": { in: 5, out: 25, cw5m: 6.25, cw1h: 10, cr: 0.5 },
        "claude-opus-4-1": { in: 15, out: 75, cw5m: 18.75, cw1h: 30, cr: 1.5 },
        "claude-opus-4": { in: 15, out: 75, cw5m: 18.75, cw1h: 30, cr: 1.5 },
        "claude-sonnet-4": { in: 3, out: 15, cw5m: 3.75, cw1h: 6, cr: 0.3 },
        "claude-haiku-4": { in: 1, out: 5, cw5m: 1.25, cw1h: 2, cr: 0.1 },
        // Claude 3系 (旧モデル)
        "claude-opus-3": { in: 15, out: 75, cw5m: 18.75, cw1h: 30, cr: 1.5 },
        "claude-opus": { in: 5, out: 25, cw5m: 6.25, cw1h: 10, cr: 0.5 },
        "claude-sonnet": { in: 3, out: 15, cw5m: 3.75, cw1h: 6, cr: 0.3 },
        "claude-haiku": { in: 0.8, out: 4, cw5m: 1, cw1h: 1.6, cr: 0.08 },
        // DeepSeek（標準料金。in=キャッシュミス入力, cr=キャッシュヒット入力）。
        // ※ deepseek-v4-pro の価格は要確認（変動しやすいので必要なら数値を更新）。
        "deepseek-reasoner": { in: 0.55, out: 2.19, cw5m: 0.55, cw1h: 0.55, cr: 0.14 },
        "deepseek-chat": { in: 0.27, out: 1.1, cw5m: 0.27, cw1h: 0.27, cr: 0.07 },
        "deepseek-v4-pro": { in: 0.435, out: 0.87, cw5m: 0.435, cw1h: 0.435, cr: 3625e-6 },
        "deepseek-v4-flash": { in: 0.14, out: 0.28, cw5m: 0.14, cw1h: 0.14, cr: 28e-4 },
        "deepseek-": { in: 0.27, out: 1.1, cw5m: 0.27, cw1h: 0.27, cr: 0.07 }
      };
      const getPricing = /* @__PURE__ */ __name((modelName) => {
        if (!modelName) return null;
        const m = modelName.toLowerCase();
        for (const [key, price] of Object.entries(MODEL_PRICING)) {
          if (m.startsWith(key)) return price;
        }
        return null;
      }, "getPricing");
      const msgs = state.currentMessages.filter((m) => !m.isHidden);
      let totalTokens = 0, totalInput = 0, totalOutput = 0;
      let totalCacheRead = 0, totalCacheWrite = 0;
      let totalCost = 0;
      let hasCost = false;
      const modelsUsed = /* @__PURE__ */ new Set();
      for (const msg of msgs) {
        const u = msg.usageMetadata;
        if (!u) continue;
        const cr = u.cacheReadInputTokens || 0;
        const cw = u.cacheCreationInputTokens || 0;
        const cw5m = u.cacheCreation5mInputTokens ?? cw;
        const cw1h = u.cacheCreation1hInputTokens || 0;
        const out = u.candidatesTokenCount || 0;
        const total = u.totalTokenCount || 0;
        const inp = u.promptTokenCount || 0;
        const regular = inp - cr - cw;
        totalTokens += total;
        totalInput += inp;
        totalOutput += out;
        totalCacheRead += cr;
        totalCacheWrite += cw;
        const modelName = msg.modelName || "";
        const displayModel = modelName || state.settings.modelName || "";
        if (displayModel) modelsUsed.add(displayModel);
        const pricing = getPricing(modelName);
        if (pricing) {
          hasCost = true;
          totalCost += (Math.max(0, regular) * pricing.in + cw5m * pricing.cw5m + cw1h * pricing.cw1h + cr * pricing.cr + out * pricing.out) / 1e6;
        }
      }
      const sizeKb = (new TextEncoder().encode(JSON.stringify(state.currentMessages)).byteLength / 1024).toFixed(2);
      const toK = /* @__PURE__ */ __name((n) => n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n), "toK");
      const hitRate = totalInput > 0 ? (totalCacheRead / totalInput * 100).toFixed(1) : "0.0";
      const rows = [
        ["合計メッセージ数", `${msgs.length} 件`],
        ["使用済みトークン合計", `${totalTokens.toLocaleString()}`],
        ["　うち入力", `${totalInput.toLocaleString()}`],
        ["　うち出力", `${totalOutput.toLocaleString()}`],
        ["💾 キャッシュ読み込み", `${toK(totalCacheRead)} (${hitRate}%)`],
        ["✏️ キャッシュ書き込み", `${toK(totalCacheWrite)}`],
        hasCost ? ["推定コスト", `$${totalCost.toFixed(4)}`] : null,
        ["会話サイズ", `${sizeKb} KB`],
        modelsUsed.size > 0 ? ["モデル", [...modelsUsed].join(", ")] : null
      ].filter(Boolean);
      elements.chatStatsContent.innerHTML = rows.map(
        ([label, value]) => `<div class="stats-row"><span class="stats-label">${label}</span><span class="stats-value">${value}</span></div>`
      ).join("");
      uiUtils.showCustomDialog(elements.chatStatsDialog, elements.chatStatsCloseBtn);
    },
    async startSummaryProcess() {
      if (state.isSending || state.editingMessageIndex !== null || state.isEditingSystemPrompt) {
        uiUtils.showCustomAlert("他の処理が完了してから、再度お試しください。");
        return;
      }
      const visibleMessages = this.getVisibleMessages();
      let start = 0;
      let end = visibleMessages.length;
      if (state.currentSummarizedContext && state.currentSummarizedContext.summaryRange) {
        const originalEndIndex = state.currentSummarizedContext.summaryRange.end;
        const summarizedVisibleMessages = visibleMessages.filter((msg) => {
          const originalIndex = state.currentMessages.indexOf(msg);
          return originalIndex < originalEndIndex;
        });
        start = summarizedVisibleMessages.length;
      }
      if (end <= start) {
        uiUtils.showCustomAlert("前回から新しい会話履歴がないため、要約する内容がありません。");
        return;
      }
      const messagesToSummarize = visibleMessages.slice(start, end);
      const originalText = messagesToSummarize.map((m) => `${m.role === "user" ? "ユーザー" : "アシスタント"}: ${m.content}`).join("\n\n");
      const confirmed = await uiUtils.showCustomConfirm(
        `履歴を要約しますか？

要約を実行すると、対象範囲のメッセージ（${messagesToSummarize.length}件）は編集・削除・再生成ができなくなります。この操作は元に戻せません。`
      );
      if (!confirmed) {
        console.log("要約処理をユーザーがキャンセルしました。");
        return;
      }
      elements.summaryDialog.dataset.originalText = originalText;
      elements.summaryDialog.dataset.summaryRangeStart = start;
      elements.summaryDialog.dataset.summaryRangeEnd = state.currentMessages.length;
      elements.summaryStats.textContent = "要約を生成中です...";
      elements.summaryEditor.value = "";
      elements.summaryEditor.disabled = true;
      elements.summaryRegenerateBtn.disabled = true;
      elements.summaryConfirmBtn.disabled = true;
      elements.summaryDialog.showModal();
      await this._callSummaryApi(originalText);
    },
    async _callSummaryApi(originalText) {
      try {
        const systemInstruction = {
          parts: [{ text: state.settings.summarySystemPrompt }]
        };
        const userContent = `【要約対象の会話履歴】
${originalText}`;
        const requestBody = {
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          systemInstruction,
          generationConfig: {
            temperature: 0.3
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        };
        const summaryModel = state.settings.summaryModelName || state.settings.modelName;
        const isSummaryDeepSeek = summaryModel.startsWith("deepseek-");
        console.log("--- [要約API] リクエスト開始 ---");
        console.log("使用モデル:", summaryModel);
        let summaryEndpoint, summaryHeaders, summaryBody;
        if (isSummaryDeepSeek) {
          const deepseekApiKey = state.settings.deepseekApiKey;
          if (!deepseekApiKey) throw new Error("DeepSeek APIキーが設定されていません。");
          summaryEndpoint = DEEPSEEK_API_BASE_URL;
          summaryHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${deepseekApiKey}` };
          summaryBody = {
            model: summaryModel,
            messages: [
              { role: "system", content: state.settings.summarySystemPrompt },
              { role: "user", content: userContent }
            ],
            temperature: 0.3
          };
        } else {
          summaryEndpoint = `${GEMINI_API_BASE_URL}${summaryModel}:generateContent`;
          summaryHeaders = { "Content-Type": "application/json", "x-goog-api-key": state.settings.apiKey };
          summaryBody = requestBody;
        }
        const response = await fetch(summaryEndpoint, {
          method: "POST",
          headers: summaryHeaders,
          body: JSON.stringify(summaryBody)
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: "レスポンスボディのJSONパースに失敗" } }));
          console.error("--- [要約API] APIエラーレスポンス ---");
          console.error("ステータス:", response.status, response.statusText);
          console.error("エラーレスポンスボディ:", errorData);
          throw new Error(errorData.error?.message || `APIエラー: ${response.status}`);
        }
        const responseData = await response.json();
        console.log("--- [要約API] 正常レスポンス ---");
        const summaryText = isSummaryDeepSeek ? responseData.choices?.[0]?.message?.content : responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summaryText) {
          let errorMessage = "APIから有効な要約結果が得られませんでした。";
          const finishReason = responseData.candidates?.[0]?.finishReason;
          const blockReason = responseData.promptFeedback?.blockReason;
          if (finishReason === "SAFETY" || blockReason) {
            const reason = finishReason === "SAFETY" ? "SAFETY" : blockReason;
            errorMessage = `生成された要約が安全フィルターにブロックされた可能性があります。(理由: ${reason})`;
            console.error(`[要約API] ブロック検出: finishReason=${finishReason}, blockReason=${blockReason}`);
          } else if (finishReason) {
            errorMessage = `APIが予期せぬ理由で応答を終了しました。(理由: ${finishReason})`;
            console.error(`[要約API] 予期せぬ終了: finishReason=${finishReason}`);
          } else {
            console.error("[要約API] 応答形式が不正です。テキスト部分が見つかりませんでした。");
          }
          throw new Error(errorMessage);
        }
        this._showSummaryDialog(summaryText, originalText.length);
      } catch (error) {
        console.error("要約API呼び出し/処理中にエラー:", error);
        elements.summaryDialog.close();
        uiUtils.showCustomAlert(`要約の生成に失敗しました: ${error.message}`);
      }
    },
    _showSummaryDialog(summaryText, originalLength) {
      const reductionRate = (100 - summaryText.length / originalLength * 100).toFixed(1);
      elements.summaryStats.textContent = `原文: ${originalLength.toLocaleString()}文字 → 要約: ${summaryText.length.toLocaleString()}文字 (${reductionRate} %削減)`;
      elements.summaryEditor.value = summaryText;
      elements.summaryEditor.disabled = false;
      elements.summaryRegenerateBtn.disabled = false;
      elements.summaryConfirmBtn.disabled = false;
      if (!elements.summaryDialog.open) {
        elements.summaryDialog.showModal();
      }
    },
    async regenerateSummary() {
      const originalText = elements.summaryDialog.dataset.originalText;
      if (originalText) {
        elements.summaryStats.textContent = "要約を再生成中です...";
        elements.summaryEditor.value = "";
        elements.summaryEditor.disabled = true;
        elements.summaryRegenerateBtn.disabled = true;
        elements.summaryConfirmBtn.disabled = true;
        await this._callSummaryApi(originalText);
      } else {
        uiUtils.showCustomAlert("再生成するための元データが見つかりませんでした。");
      }
    },
    async confirmSummary() {
      const summaryText = elements.summaryEditor.value.trim();
      if (!summaryText) {
        uiUtils.showCustomAlert("要約内容が空です。");
        return;
      }
      const start = parseInt(elements.summaryDialog.dataset.summaryRangeStart, 10);
      const end = parseInt(elements.summaryDialog.dataset.summaryRangeEnd, 10);
      try {
        const existingSummary = state.currentSummarizedContext ? state.currentSummarizedContext.summaryText : "";
        const newSummaryText = existingSummary ? `${existingSummary}

${summaryText}` : summaryText;
        state.currentSummarizedContext = {
          summaryText: newSummaryText,
          summaryRange: { start: 0, end },
          // startは常に0、endを更新
          summarizedAt: Date.now()
        };
        await dbUtils.saveChat();
        elements.summaryDialog.close("confirm");
        uiUtils.renderChatMessages();
        await uiUtils.showCustomAlert(`履歴の要約を保存しました。
次回以降、APIには要約された内容が送信されます。`);
      } catch (error) {
        console.error("要約の保存エラー:", error);
        await uiUtils.showCustomAlert(`要約の保存に失敗しました: ${error.message}`);
      }
    },
    toggleSummaryButtonVisibility() {
      elements.summarizeHistoryBtn.classList.toggle("hidden", !state.settings.enableSummaryButton);
    }
  };

  // src/app-logic.js
  var appLogic = Object.assign(
    {},
    profileMethods,
    lifecycleMethods,
    syncMethods,
    chatMethods,
    messageMethods,
    attachmentMethods,
    mediaMethods,
    memoryMethods
  );

  // src/db.js
  var dbUtils = {
    openDB() {
      return new Promise((resolve, reject) => {
        if (state.db) {
          resolve(state.db);
          return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onblocked = (event) => {
          console.warn("IndexedDBのバージョンアップがブロックされました。古い接続が残っています。", event);
          uiUtils.showCustomAlert(
            "アプリの更新が他のチャットセッションのタブによってブロックされています。\n\nこのアプリを開いている他のタブを閉じてから、このタブを再読み込み（リロード）してください。"
          );
        };
        request.onerror = (event) => {
          console.error("IndexedDBエラー:", event.target.error);
          reject(`IndexedDBエラー: ${event.target.error}`);
        };
        request.onsuccess = (event) => {
          state.db = event.target.result;
          console.log("IndexedDBオープン成功");
          state.db.onerror = (event2) => {
            console.error(`データベースエラー: ${event2.target.error}`);
          };
          resolve(state.db);
        };
        request.onupgradeneeded = (event) => {
          applyDbMigrations(event.target.result, event.target.transaction, event, {
            settingsDefaults: state.settings,
            migrateImageData: /* @__PURE__ */ __name(() => appLogic.migrateImageData(), "migrateImageData")
          });
        };
      });
    },
    // 指定されたストアを取得する内部関数
    _getStore(storeName, mode = "readonly") {
      if (!state.db) throw new Error("データベースが開かれていません");
      const transaction = state.db.transaction([storeName], mode);
      return transaction.objectStore(storeName);
    },
    // 設定を保存
    async saveSetting(key, value) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        try {
          console.log(`[DEBUG] saveSetting: key='${key}' の保存トランザクションを開始します。`);
          const transaction = state.db.transaction([SETTINGS_STORE], "readwrite");
          const store = transaction.objectStore(SETTINGS_STORE);
          store.put({ key, value });
          transaction.oncomplete = () => {
            console.log(`[DEBUG] saveSetting: key='${key}' のトランザクションが正常に完了しました。`);
            resolve();
          };
          transaction.onerror = (event) => {
            console.error(`[DEBUG] saveSetting: key='${key}' のトランザクションエラー:`, event.target.error);
            reject(event.target.error);
          };
        } catch (error) {
          console.error(`[DEBUG] saveSetting: ストアアクセスエラー:`, error);
          reject(error);
        }
      });
    },
    async saveChat(optionalTitle = null, chatObjectToSave = null, options = {}) {
      await this.openDB();
      let messagesForStats = [];
      let chatDataToSave;
      if (!chatObjectToSave) {
        if ((!state.currentMessages || state.currentMessages.length === 0) && !state.currentSystemPrompt) {
          if (state.currentChatId) console.log(`saveChat: 既存チャット ${state.currentChatId} にメッセージもシステムプロンプトもないため保存せず`);
          else console.log("saveChat: 新規チャットに保存するメッセージもシステムプロンプトもなし");
          return state.currentChatId;
        }
        const messagesToSave = state.currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          thoughtSummary: msg.thoughtSummary || null,
          tool_calls: msg.tool_calls || null,
          imageIds: msg.imageIds,
          finishReason: msg.finishReason,
          safetyRatings: msg.safetyRatings,
          error: msg.error,
          isCascaded: msg.isCascaded,
          isSelected: msg.isSelected,
          siblingGroupId: msg.siblingGroupId,
          groundingMetadata: msg.groundingMetadata,
          // attachments を安全にコピーし、file オブジェクトのみ除外する
          attachments: msg.attachments ? msg.attachments.map((att) => ({
            name: att.name,
            mimeType: att.mimeType,
            base64Data: att.base64Data,
            assetId: att.assetId
          })) : void 0,
          usageMetadata: msg.usageMetadata,
          modelName: msg.modelName,
          executedFunctions: msg.executedFunctions,
          generated_images: msg.generated_images,
          generated_videos: msg.generated_videos ? msg.generated_videos.map((video) => ({
            base64Data: video.base64Data,
            prompt: video.prompt
          })) : void 0,
          isHidden: msg.isHidden,
          isAutoTrigger: msg.isAutoTrigger
        }));
        messagesForStats = messagesToSave;
        chatDataToSave = {
          messages: messagesToSave,
          systemPrompt: state.currentSystemPrompt,
          persistentMemory: state.currentPersistentMemory || {},
          summarizedContext: state.currentSummarizedContext || null,
          isMemoryEnabledForChat: state.isMemoryEnabledForChat
        };
      } else {
        messagesForStats = chatObjectToSave.messages || [];
        chatDataToSave = chatObjectToSave;
      }
      const stats = await this._calculateChatStats(messagesForStats);
      return new Promise((resolve, reject) => {
        try {
          const transaction = state.db.transaction([CHATS_STORE], "readwrite");
          const store = transaction.objectStore(CHATS_STORE);
          const now = Date.now();
          const processSave = /* @__PURE__ */ __name((existingChatData = null) => {
            let title;
            if (optionalTitle !== null) {
              title = optionalTitle;
            } else if (existingChatData && existingChatData.title) {
              title = existingChatData.title;
            } else {
              const firstUserMessage = (chatDataToSave.messages || []).find((m) => m.role === "user" && !m.isHidden);
              title = firstUserMessage ? firstUserMessage.content.substring(0, 50) : "無題のチャット";
            }
            const chatIdForOperation = existingChatData ? existingChatData.id : state.currentChatId;
            const finalChatData = {
              ...chatDataToSave,
              updatedAt: chatObjectToSave && chatObjectToSave.updatedAt ? chatObjectToSave.updatedAt : now,
              createdAt: existingChatData ? existingChatData.createdAt : now,
              title,
              stats
            };
            if (chatIdForOperation) {
              finalChatData.id = chatIdForOperation;
            }
            const inheritedProjectId = chatDataToSave && chatDataToSave.projectId || existingChatData && existingChatData.projectId;
            if (inheritedProjectId) {
              finalChatData.projectId = inheritedProjectId;
            } else if (window.state && window.state.activeProjectId) {
              finalChatData.projectId = window.state.activeProjectId;
            }
            const putRequest = store.put(finalChatData);
            putRequest.onsuccess = (event) => {
              const savedId = event.target.result;
              if (!state.currentChatId && savedId) {
                state.currentChatId = savedId;
              }
              console.log(`チャット ${state.currentChatId ? "更新" : "保存"} 完了 ID:`, state.currentChatId || savedId);
              if ((state.currentChatId || savedId) === (chatIdForOperation || savedId)) {
                uiUtils.updateChatTitle(finalChatData.title);
              }
              if (!options.skipPush) {
                appLogic.markAsDirtyAndSchedulePush();
              }
            };
            putRequest.onerror = (event) => {
              console.error("チャット保存(put)エラー:", event.target.error);
            };
          }, "processSave");
          if (state.currentChatId && !chatObjectToSave) {
            const getRequest = store.get(state.currentChatId);
            getRequest.onsuccess = (event) => {
              const existingChat = event.target.result;
              if (!existingChat) {
                console.warn(`ID ${state.currentChatId} のチャットが見つかりません(保存時)。新規として保存します。`);
                state.currentChatId = null;
              }
              processSave(existingChat);
            };
            getRequest.onerror = (event) => {
              console.error("既存チャットの取得エラー(更新用):", event.target.error);
              state.currentChatId = null;
              processSave(null);
            };
          } else {
            processSave(chatObjectToSave);
          }
          transaction.oncomplete = () => {
            resolve(state.currentChatId);
          };
          transaction.onerror = (event) => {
            console.error("チャット保存トランザクション失敗:", event.target.error);
            reject(new Error(`チャット保存トランザクション失敗: ${event.target.error.message}`));
          };
        } catch (error) {
          console.error("チャット保存処理の開始に失敗:", error);
          reject(error);
        }
      });
    },
    async _calculateChatStats(messages) {
      if (!messages) return null;
      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      const assetIds = /* @__PURE__ */ new Set();
      let totalAssetSize = 0;
      let attachmentCount = 0;
      messages.forEach((msg) => {
        if (msg.usageMetadata) {
          if (typeof msg.usageMetadata.totalTokenCount === "number") {
            totalTokens += msg.usageMetadata.totalTokenCount;
          }
          if (typeof msg.usageMetadata.promptTokenCount === "number") {
            inputTokens += msg.usageMetadata.promptTokenCount;
          }
          if (typeof msg.usageMetadata.candidatesTokenCount === "number") {
            outputTokens += msg.usageMetadata.candidatesTokenCount;
          }
        }
        if (msg.imageIds) {
          msg.imageIds.forEach((id) => assetIds.add(id));
        }
        if (msg.attachments) {
          attachmentCount += msg.attachments.length;
          msg.attachments.forEach((att) => {
            if (att.base64Data) {
              totalAssetSize += Math.ceil(att.base64Data.length * 0.75);
            }
          });
        }
      });
      if (assetIds.size > 0) {
        await this.openDB();
        const store = this._getStore(IMAGE_STORE);
        const imagePromises = Array.from(assetIds).map((id) => {
          return new Promise((resolve) => {
            const request = store.get(id);
            request.onsuccess = (event) => {
              if (event.target.result && event.target.result.blob instanceof Blob) {
                resolve(event.target.result.blob.size);
              } else {
                resolve(0);
              }
            };
            request.onerror = () => resolve(0);
          });
        });
        const sizes = await Promise.all(imagePromises);
        totalAssetSize += sizes.reduce((sum, size) => sum + size, 0);
      }
      return {
        totalTokens,
        inputTokens,
        outputTokens,
        assetCount: assetIds.size + attachmentCount,
        totalAssetSize
      };
    },
    // チャットタイトルをDBで更新
    async updateChatTitleDb(id, newTitle) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(CHATS_STORE, "readwrite");
        const getRequest = store.get(id);
        getRequest.onsuccess = (event) => {
          const chatData = event.target.result;
          if (chatData) {
            chatData.title = newTitle;
            chatData.updatedAt = Date.now();
            const putRequest = store.put(chatData);
            putRequest.onsuccess = () => {
              appLogic.markAsDirtyAndSchedulePush(true);
              resolve();
            };
            putRequest.onerror = (event2) => reject(`タイトル更新エラー: ${event2.target.error}`);
          } else {
            reject(`チャットが見つかりません: ${id}`);
          }
        };
        getRequest.onerror = (event) => reject(`タイトル更新用チャット取得エラー: ${event.target.error}`);
        store.transaction.onerror = (event) => reject(`タイトル更新トランザクション失敗: ${event.target.error}`);
      });
    },
    // 指定IDのチャットを取得
    async getChat(id) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(CHATS_STORE);
        const request = store.get(id);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`チャット ${id} 取得エラー: ${event.target.error}`);
      });
    },
    // 全チャットを取得 (ソート順指定可)
    async getAllChats(sortBy = "updatedAt") {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(CHATS_STORE);
        const indexName = sortBy === "createdAt" ? CHAT_CREATEDAT_INDEX : CHAT_UPDATEDAT_INDEX;
        if (!store.indexNames.contains(indexName)) {
          console.error(`インデックス "${indexName}" が見つかりません。主キー順でフォールバックします。`);
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = (event) => resolve(event.target.result.reverse());
          getAllRequest.onerror = (event) => reject(`全チャット取得エラー(フォールバック): ${event.target.error}`);
          return;
        }
        const index = store.index(indexName);
        const request = index.openCursor(null, "prev");
        const chats = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            chats.push(cursor.value);
            cursor.continue();
          } else {
            resolve(chats);
          }
        };
        request.onerror = (event) => reject(`全チャット取得エラー (${sortBy}順): ${event.target.error}`);
      });
    },
    // 指定IDのチャットを削除
    async deleteChat(id) {
      await this.openDB();
      const chatToDelete = await this.getChat(id);
      const imageIdsToDelete = /* @__PURE__ */ new Set();
      if (chatToDelete && chatToDelete.messages) {
        chatToDelete.messages.forEach((message) => {
          (message.imageIds || []).forEach((imgId) => imageIdsToDelete.add(imgId));
        });
      }
      const allOtherChats = (await this.getAllChats()).filter((chat) => chat.id !== id);
      const activeImageIdsInOtherChats = /* @__PURE__ */ new Set();
      allOtherChats.forEach((chat) => {
        (chat.messages || []).forEach((message) => {
          (message.imageIds || []).forEach((imgId) => activeImageIdsInOtherChats.add(imgId));
        });
      });
      const finalImageIdsToDelete = [...imageIdsToDelete].filter((id2) => !activeImageIdsInOtherChats.has(id2));
      return new Promise((resolve, reject) => {
        const storeNames = [CHATS_STORE];
        if (finalImageIdsToDelete.length > 0) {
          storeNames.push(IMAGE_STORE);
        }
        const transaction = state.db.transaction(storeNames, "readwrite");
        const chatStore = transaction.objectStore(CHATS_STORE);
        chatStore.delete(id);
        if (finalImageIdsToDelete.length > 0) {
          const imageStore = transaction.objectStore(IMAGE_STORE);
          console.log(`[Delete Chat] チャット(ID:${id})に関連する ${finalImageIdsToDelete.length}件の画像をimage_storeから削除します。`);
          finalImageIdsToDelete.forEach((imgId) => imageStore.delete(imgId));
        }
        transaction.oncomplete = () => {
          console.log(`チャット削除完了 (ID: ${id})`);
          appLogic.markAsDirtyAndSchedulePush(true);
          resolve();
        };
        transaction.onerror = (event) => {
          console.error(`チャット(ID:${id})の削除トランザクション中にエラー:`, event.target.error);
          reject(`チャット ${id} 削除エラー: ${event.target.error}`);
        };
      });
    },
    // 全データ (設定とチャット) をクリア
    async clearAllData() {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const storeNames = Array.from(state.db.objectStoreNames);
        if (storeNames.length === 0) {
          console.log("クリア対象のストアが存在しません。");
          resolve();
          return;
        }
        console.log(`以下のストアをクリアします: ${storeNames.join(", ")}`);
        const transaction = state.db.transaction(storeNames, "readwrite");
        let storesCleared = 0;
        const totalStores = storeNames.length;
        transaction.oncomplete = () => {
          console.log("IndexedDBの全データ削除完了");
          resolve();
        };
        transaction.onerror = (event) => {
          reject(`データクリアトランザクション失敗: ${event.target.error}`);
        };
        storeNames.forEach((storeName) => {
          const request = transaction.objectStore(storeName).clear();
          request.onerror = (event) => {
            console.error(`${storeName} のクリア中にエラー:`, event.target.error);
          };
        });
      });
    },
    async getSetting(key) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        try {
          const store = this._getStore(SETTINGS_STORE);
          const request = store.get(key);
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
          request.onerror = (event) => {
            reject(event.target.error);
          };
        } catch (e) {
          reject(e);
        }
      });
    },
    async addProfile(profile) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(PROFILES_STORE, "readwrite");
        const request = store.add(profile);
        request.onsuccess = (event) => {
          console.log(`[DB] プロファイルを新規追加しました (ID: ${event.target.result})`);
          resolve(event.target.result);
        };
        request.onerror = (event) => reject(`プロファイル追加エラー: ${event.target.error}`);
      });
    },
    async getProfile(id) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(PROFILES_STORE);
        const request = store.get(id);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`プロファイル(ID: ${id})取得エラー: ${event.target.error}`);
      });
    },
    async getAllProfiles() {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(PROFILES_STORE);
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`全プロファイル取得エラー: ${event.target.error}`);
      });
    },
    async updateProfile(profile) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(PROFILES_STORE, "readwrite");
        const request = store.put(profile);
        request.onsuccess = () => {
          console.log(`[DB] プロファイルを更新しました (ID: ${profile.id})`);
          resolve();
        };
        request.onerror = (event) => reject(`プロファイル(ID: ${profile.id})更新エラー: ${event.target.error}`);
      });
    },
    async deleteProfile(id) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore(PROFILES_STORE, "readwrite");
        const request = store.delete(id);
        request.onsuccess = () => {
          console.log(`[DB] プロファイルを削除しました (ID: ${id})`);
          resolve();
        };
        request.onerror = (event) => reject(`プロファイル(ID: ${id})削除エラー: ${event.target.error}`);
      });
    },
    async getAsset(name) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("image_assets");
        const request = store.get(name);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`アセット ${name} 取得エラー: ${event.target.error}`);
      });
    },
    async getAllAssets() {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("image_assets");
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`全アセット取得エラー: ${event.target.error}`);
      });
    },
    // image_assets ストアへアセット（{ name, blob, createdAt }）を保存/上書き。
    async saveAsset(asset) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("image_assets", "readwrite");
        const request = store.put(asset);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`アセット ${asset?.name} 保存エラー: ${event.target.error}`);
      });
    },
    async deleteAsset(name) {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("image_assets", "readwrite");
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(`アセット ${name} 削除エラー: ${event.target.error}`);
      });
    },
    async getMemory(profileId) {
      if (!profileId) return null;
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("memory_store");
        const request = store.get(profileId);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`メモリ(ID: ${profileId})取得エラー: ${event.target.error}`);
      });
    },
    async saveMemory(profileId, memoryData) {
      if (!profileId) return Promise.reject("プロファイルIDが必要です。");
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("memory_store", "readwrite");
        const dataToSave = { profileId, ...memoryData };
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          console.log(`[DB] メモリを保存しました (ID: ${profileId})`);
          resolve();
        };
        request.onerror = (event) => reject(`メモリ(ID: ${profileId})保存エラー: ${event.target.error}`);
      });
    },
    async getAllMemories() {
      await this.openDB();
      return new Promise((resolve, reject) => {
        const store = this._getStore("memory_store");
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(`全メモリ取得エラー: ${event.target.error}`);
      });
    },
    /**
     * [V2] メタデータを受け取り、アセットをDLしてからDBをクリア＆インポートする
     */
    async clearAndImportData(data, localAssetsBeforeClear, downloadedAssets, requiredAssetIds) {
      console.log("[DB Import V2] 安全なデータインポート処理を開始します。");
      uiUtils.showProgressDialog("データベースを準備中...");
      const { profiles, chats, memories, projects, assets, settings } = data;
      const allAvailableAssets = new Map([...localAssetsBeforeClear, ...downloadedAssets]);
      console.log(`[DB Import V2] 利用可能なアセットの完全なマップを作成しました: ${allAvailableAssets.size}件`);
      const missingAssetInfo = {};
      (chats || []).forEach((chat) => {
        const missingIdsForThisChat = /* @__PURE__ */ new Set();
        (chat.messages || []).forEach((message) => {
          if (Array.isArray(message.imageIds) && message.imageIds.length > 0) {
            message.imageIds.forEach((id) => {
              if (id && !allAvailableAssets.has(id)) {
                missingIdsForThisChat.add(id);
              }
            });
          }
        });
        if (missingIdsForThisChat.size > 0) {
          const key = chat.title || `ID:${chat.id}`;
          missingAssetInfo[key] = [...missingIdsForThisChat];
        }
      });
      if (Object.keys(missingAssetInfo).length > 0) {
        console.error("[DB Import V2] 必要な画像アセットの一部が見つからないため、インポートを中止します。", missingAssetInfo);
        const error = new Error("必要な画像アセットのダウンロードに失敗したため、データのインポートを中止しました。再度同期をお試しください。");
        error.code = "MISSING_ASSETS";
        error.missingAssetInfo = missingAssetInfo;
        throw error;
      }
      const profilesWithBlobs = (profiles || []).map((p) => {
        if (p.iconAssetId && allAvailableAssets.has(p.iconAssetId)) {
          p.icon = allAvailableAssets.get(p.iconAssetId);
        }
        return p;
      });
      const assetsWithBlobs = (assets || []).map((a) => ({
        name: a.name,
        assetId: a.assetId,
        blob: allAvailableAssets.get(a.assetId),
        createdAt: a.createdAt
      })).filter((a) => a.blob);
      const imagesWithBlobs = [];
      requiredAssetIds.forEach((id) => {
        if (allAvailableAssets.has(id)) {
          imagesWithBlobs.push({
            id,
            blob: allAvailableAssets.get(id),
            createdAt: /* @__PURE__ */ new Date()
          });
        }
      });
      const tempStoreNames = [
        `${PROFILES_STORE}_temp`,
        `${CHATS_STORE}_temp`,
        `${SETTINGS_STORE}_temp`,
        `${IMAGE_STORE}_temp`,
        "image_assets_temp",
        "memory_store_temp",
        "projects_temp"
      ];
      const mainStoreNames = [
        PROFILES_STORE,
        CHATS_STORE,
        SETTINGS_STORE,
        IMAGE_STORE,
        "image_assets",
        "memory_store",
        PROJECTS_STORE
      ];
      const currentTokens = await dbUtils.getSetting("dropboxTokens");
      try {
        uiUtils.updateProgressMessage("データを一時領域にインポート中...");
        const tempTx = state.db.transaction(tempStoreNames, "readwrite");
        const tempStores = {
          "profiles_temp": profilesWithBlobs,
          "chats_temp": chats || [],
          "memory_store_temp": memories || [],
          "projects_temp": projects || [],
          "image_assets_temp": assetsWithBlobs,
          "image_store_temp": imagesWithBlobs,
          "settings_temp": settings || []
        };
        const tempClearPromises = tempStoreNames.map((name) => {
          return new Promise((resolve, reject) => {
            const request = tempTx.objectStore(name).clear();
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
          });
        });
        await Promise.all(tempClearPromises);
        for (const storeName in tempStores) {
          const store = tempTx.objectStore(storeName);
          (tempStores[storeName] || []).forEach((item) => store.put(item));
        }
        await new Promise((resolve, reject) => {
          tempTx.oncomplete = resolve;
          tempTx.onerror = () => reject(tempTx.error);
        });
        console.log("[DB Import V2] 一時ストアへのデータ書き込みが完了しました。");
        uiUtils.updateProgressMessage("データベースを更新中...");
        const mainTx = state.db.transaction([...mainStoreNames, ...tempStoreNames], "readwrite");
        const mainClearPromises = mainStoreNames.map((name) => {
          return new Promise((resolve, reject) => {
            const request = mainTx.objectStore(name).clear();
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
          });
        });
        await Promise.all(mainClearPromises);
        for (let i = 0; i < mainStoreNames.length; i++) {
          const mainStore = mainTx.objectStore(mainStoreNames[i]);
          const tempStore = mainTx.objectStore(tempStoreNames[i]);
          const allTempItemsReq = tempStore.getAll();
          allTempItemsReq.onsuccess = () => {
            allTempItemsReq.result.forEach((item) => mainStore.put(item));
          };
        }
        const tempClearPromises2 = tempStoreNames.map((name) => {
          return new Promise((resolve, reject) => {
            const request = mainTx.objectStore(name).clear();
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
          });
        });
        await Promise.all(tempClearPromises2);
        if (currentTokens) {
          mainTx.objectStore(SETTINGS_STORE).put(currentTokens);
        }
        await new Promise((resolve, reject) => {
          mainTx.oncomplete = resolve;
          mainTx.onerror = () => reject(mainTx.error);
        });
        console.log("[DB Import V2] メインデータベースの更新が正常に完了しました。");
        return { removedAssetInfo: missingAssetInfo };
      } catch (error) {
        console.error("[DB Import V2] 安全なインポート処理中にエラーが発生しました:", error);
        try {
          const cleanupTx = state.db.transaction(tempStoreNames, "readwrite");
          const cleanupPromises = tempStoreNames.map((name) => {
            return new Promise((resolve, reject) => {
              const request = cleanupTx.objectStore(name).clear();
              request.onsuccess = resolve;
              request.onerror = () => reject(request.error);
            });
          });
          await Promise.all(cleanupPromises);
        } catch (cleanupError) {
          console.error("[DB Import V2] エラー後のクリーンアップに失敗:", cleanupError);
        }
        throw error;
      }
    }
  };

  // src/app.js
  import("https://esm.run/@google/genai").then((module) => {
    window.GoogleGenAI = module.GoogleGenAI;
    console.log("Google GenAI SDK (@google/genai) の読み込みが完了しました。");
  }).catch((err) => {
    console.error("Google Gen AI SDKの読み込みに失敗しました:", err);
    document.body.innerHTML = `<p style="color: red; padding: 20px;">SDKの読み込みに失敗しました。アプリを起動できません。</p>`;
  });
  var broadcastChannel = null;
  function updateMessageMaxWidthVar() {
    const container = elements.messageContainer;
    if (!container) return;
    const isWideMode = state.settings.enableWideMode && window.innerWidth > 800;
    const percentage = isWideMode ? 0.7 : 0.8;
    let maxWidthPx = container.clientWidth * percentage;
    document.documentElement.style.setProperty("--message-max-width", `${maxWidthPx}px`);
  }
  __name(updateMessageMaxWidthVar, "updateMessageMaxWidthVar");
  window.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed. Initializing app...");
    appLogic.initializeApp();
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.addEventListener("focusout", () => {
        viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
        requestAnimationFrame(() => {
          viewport.setAttribute("content", "width=device-width, initial-scale=1");
        });
      });
    }
  });
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("このブラウザはService Workerをサポートしていません。");
      return;
    }
    let isReloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (isReloading) return;
      isReloading = true;
      console.log("Controller has changed, reloading page for update...");
      window.location.reload();
    });
    const handleUpdateFound = /* @__PURE__ */ __name((registration) => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log("新しいService Workerのインストールを検知しました。");
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("新しいService Workerが待機状態に入りました。アクティベートを試みます。");
            if (state.db) {
              state.db.close();
              console.log("Service Worker更新のため、現在のDB接続を閉じました。");
            }
            newWorker.postMessage({ action: "skipWaiting" });
          }
        });
      }
    }, "handleUpdateFound");
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.status === "cacheCleared") {
        console.log("Service Workerから手動キャッシュクリア完了のメッセージを受信。リロードを実行します。");
        if (isReloading) return;
        isReloading = true;
        window.location.reload();
      }
    });
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js");
        console.log("ServiceWorker登録成功 スコープ: ", registration.scope);
        const checkForUpdates = /* @__PURE__ */ __name(() => {
          navigator.serviceWorker.ready.then((readyRegistration) => {
            readyRegistration.update();
          }).catch((error) => {
            console.error("navigator.serviceWorker.ready failed:", error);
          });
        }, "checkForUpdates");
        setInterval(checkForUpdates, 60 * 60 * 1e3);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdates();
        });
        window.addEventListener("focus", checkForUpdates);
        if (registration.waiting) {
          console.log("待機中の新しいService Workerが見つかりました。アクティベートを試みます。");
          if (state.db) state.db.close();
          registration.waiting.postMessage({ action: "skipWaiting" });
        }
        registration.addEventListener("updatefound", () => handleUpdateFound(registration));
      } catch (error) {
        console.error("ServiceWorker処理中にエラー: ", error);
      }
    });
  }
  __name(registerServiceWorker, "registerServiceWorker");
  function setupBroadcastChannel() {
    if ("BroadcastChannel" in window) {
      try {
        broadcastChannel = new BroadcastChannel("gemini-pwa-sync-channel");
        console.log("[BroadcastChannel] チャンネルに接続しました。");
        broadcastChannel.onmessage = async (event) => {
          const { type, newSyncId, sourceTabId } = event.data;
          if (sourceTabId === state.tabId) {
            return;
          }
          console.log(`[BroadcastChannel] 他のタブからメッセージを受信:`, event.data);
          if (type === "SYNC_COMPLETED" && newSyncId) {
            state.sync.lastSyncId = newSyncId;
            state.sync.isDirty = false;
            state.sync.lastError = null;
            await dbUtils.saveSetting("lastSyncId", newSyncId);
            await dbUtils.saveSetting("syncIsDirty", false);
            await dbUtils.saveSetting("syncLastError", null);
            await dbUtils.saveSetting("lastSyncTimestamp", Date.now());
            await appLogic.updateDropboxUIState();
          }
        };
      } catch (error) {
        console.error("[BroadcastChannel] チャンネルの作成に失敗しました:", error);
      }
    } else {
      console.warn("[BroadcastChannel] このブラウザはBroadcastChannelをサポートしていません。");
    }
  }
  __name(setupBroadcastChannel, "setupBroadcastChannel");
  window.appLogic = appLogic;
  window.state = state;
  window.dbUtils = dbUtils;
  (function() {
    function initHeaderModelSwitcher() {
      const headerSelect = document.getElementById("header-model-select");
      const mainSelect = document.getElementById("model-name");
      if (!headerSelect || !mainSelect) return;
      const syncToHeader = /* @__PURE__ */ __name(() => {
        if (mainSelect.innerHTML !== headerSelect.innerHTML) {
          headerSelect.innerHTML = mainSelect.innerHTML;
        }
        if (window.state && window.state.settings && window.state.settings.modelName) {
          if (headerSelect.value !== window.state.settings.modelName) {
            headerSelect.value = window.state.settings.modelName;
          }
        } else if (headerSelect.value !== mainSelect.value) {
          headerSelect.value = mainSelect.value;
        }
      }, "syncToHeader");
      const observer = new MutationObserver(syncToHeader);
      observer.observe(mainSelect, { childList: true, subtree: true });
      setInterval(syncToHeader, 1e3);
      headerSelect.addEventListener("change", async (e) => {
        const newModel = e.target.value;
        const selectedOpt = headerSelect.options[headerSelect.selectedIndex];
        if (window.state && window.state.settings) {
          window.state.settings.modelName = newModel;
          mainSelect.value = newModel;
          if (selectedOpt && selectedOpt.dataset.provider) {
            const provider = selectedOpt.dataset.provider;
            const apiProvSelect = document.getElementById("api-provider");
            if (apiProvSelect && window.state.settings.apiProvider !== provider) {
              window.state.settings.apiProvider = provider;
              apiProvSelect.value = provider;
              apiProvSelect.dispatchEvent(new Event("change"));
              if (window.state.activeProfile) {
                window.state.activeProfile.settings.apiProvider = provider;
                if (window.dbUtils && typeof window.dbUtils.updateProfile === "function") {
                  await window.dbUtils.updateProfile(window.state.activeProfile);
                }
              }
            }
          } else if (newModel.startsWith("gemini-")) {
            const apiProvSelect = document.getElementById("api-provider");
            if (apiProvSelect && window.state.settings.apiProvider !== "gemini") {
              window.state.settings.apiProvider = "gemini";
              apiProvSelect.value = "gemini";
              apiProvSelect.dispatchEvent(new Event("change"));
            }
          }
          const curProvider = window.state.settings.apiProvider;
          if (curProvider && newModel) {
            window.state.settings.lastModelPerProvider = window.state.settings.lastModelPerProvider || {};
            window.state.settings.lastModelPerProvider[curProvider] = newModel;
          }
          if (window.state.activeProfile && window.dbUtils && typeof window.dbUtils.updateProfile === "function") {
            window.state.activeProfile.settings = window.state.activeProfile.settings || {};
            window.state.activeProfile.settings.modelName = newModel;
            window.state.activeProfile.settings.apiProvider = curProvider;
            window.state.activeProfile.settings.lastModelPerProvider = window.state.settings.lastModelPerProvider;
            await window.dbUtils.updateProfile(window.state.activeProfile);
          }
          console.log(`[Model Switcher] Model changed to: ${newModel} (Provider: ${window.state.settings.apiProvider})`);
        }
      });
    }
    __name(initHeaderModelSwitcher, "initHeaderModelSwitcher");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(initHeaderModelSwitcher, 500));
    } else {
      setTimeout(initHeaderModelSwitcher, 500);
    }
  })();
  (function() {
    window.state.activeProjectId = null;
    window.state.activeProjectKnowledge = [];
    let projectsCache = [];
    async function initProjectManager() {
      const headerSelect = document.getElementById("header-project-select");
      const dialog = document.getElementById("projectManagementDialog");
      if (!headerSelect || !dialog) return;
      if (window.dbUtils) {
        window.dbUtils.getAllProjects = async () => {
          const db = await window.dbUtils.openDB();
          return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains("projects")) return resolve([]);
            const req = db.transaction("projects", "readonly").objectStore("projects").getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
        };
        window.dbUtils.addProject = async (project) => {
          const db = await window.dbUtils.openDB();
          return new Promise((resolve, reject) => {
            const req = db.transaction("projects", "readwrite").objectStore("projects").add(project);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
        };
        window.dbUtils.deleteProject = async (id) => {
          const db = await window.dbUtils.openDB();
          return new Promise((resolve, reject) => {
            const req = db.transaction("projects", "readwrite").objectStore("projects").delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        };
        window.dbUtils.updateProject = async (project) => {
          const db = await window.dbUtils.openDB();
          return new Promise((resolve, reject) => {
            const req = db.transaction("projects", "readwrite").objectStore("projects").put(project);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        };
        const originalGetAllChats = window.dbUtils.getAllChats;
        window.dbUtils.getAllChatsUnfiltered = originalGetAllChats.bind(window.dbUtils);
        window.dbUtils.getAllChats = async function(sortBy) {
          const allChats = await originalGetAllChats.call(this, sortBy);
          if (window.state.activeProjectId) {
            return allChats.filter((c) => c.projectId === window.state.activeProjectId);
          }
          return allChats;
        };
      }
      if (window.appLogic && window.appLogic.startNewChat) {
        const originalStartNewChat = window.appLogic.startNewChat;
        window.appLogic.startNewChat = function() {
          originalStartNewChat.call(this);
          if (window.state.activeProjectId) {
            const activeP = projectsCache.find((p) => p.id === window.state.activeProjectId);
            if (activeP) {
              if (activeP.systemPrompt) {
                window.state.currentSystemPrompt = activeP.systemPrompt;
                const editor = document.getElementById("system-prompt-editor");
                if (editor) editor.value = activeP.systemPrompt;
              }
              window.state.activeProjectKnowledge = activeP.knowledgeFiles || [];
              if (activeP.defaultModel) {
                const headerModelSelect = document.getElementById("header-model-select");
                if (headerModelSelect) {
                  headerModelSelect.value = activeP.defaultModel;
                  headerModelSelect.dispatchEvent(new Event("change"));
                }
              }
            }
          } else {
            window.state.activeProjectKnowledge = [];
          }
        };
      }
      async function loadProjects() {
        if (!window.dbUtils || !window.dbUtils.getAllProjects) return;
        projectsCache = await window.dbUtils.getAllProjects();
        window.projectsCache = projectsCache;
        const currentVal = (window.state.activeProjectId != null ? String(window.state.activeProjectId) : null) || headerSelect.value;
        headerSelect.innerHTML = '<option value="">すべてのプロジェクト</option><option value="manage">⚙️ プロジェクト管理...</option>';
        projectsCache.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name;
          headerSelect.appendChild(opt);
        });
        if (currentVal && projectsCache.find((p) => p.id === parseInt(currentVal, 10))) {
          headerSelect.value = currentVal;
          window.state.activeProjectId = parseInt(currentVal, 10);
        } else if (currentVal === "manage") {
          headerSelect.value = window.state.activeProjectId || "";
        } else {
          headerSelect.value = "";
          window.state.activeProjectId = null;
        }
        const listContainer = document.getElementById("project-list-container");
        if (!listContainer) return;
        listContainer.innerHTML = "";
        projectsCache.forEach((p) => {
          const div = document.createElement("div");
          div.className = "project-item";
          div.innerHTML = `
                    <div class="project-item-header">
                        <span class="project-item-title">${p.name}</span>
                        <div class="project-item-actions">
                            <button class="edit-prompt-btn" data-id="${p.id}" title="指示を編集"><span class="material-symbols-outlined">edit</span></button>
                            <button class="delete-project-btn" data-id="${p.id}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                `;
          const promptPreview = document.createElement("div");
          promptPreview.className = "project-item-system-prompt";
          promptPreview.textContent = p.systemPrompt || "（指示なし）";
          promptPreview.style.cssText = p.systemPrompt ? "" : "color:var(--text-secondary,#888); font-style:italic;";
          div.appendChild(promptPreview);
          const promptEditArea = document.createElement("div");
          promptEditArea.style.cssText = "display:none; margin-top:6px;";
          const nameLabel = document.createElement("label");
          nameLabel.textContent = "プロジェクト名";
          nameLabel.style.cssText = "font-size:0.85em; color:var(--text-secondary,#888); display:block; margin-bottom:2px;";
          const nameInput = document.createElement("input");
          nameInput.type = "text";
          nameInput.value = p.name || "";
          nameInput.style.cssText = "width:100%; font-size:0.9em; box-sizing:border-box; margin-bottom:8px; padding:4px 6px;";
          const promptLabel = document.createElement("label");
          promptLabel.textContent = "システムプロンプト";
          promptLabel.style.cssText = "font-size:0.85em; color:var(--text-secondary,#888); display:block; margin-bottom:2px;";
          const promptTextarea = document.createElement("textarea");
          promptTextarea.value = p.systemPrompt || "";
          promptTextarea.placeholder = "このプロジェクトのシステムプロンプトを入力...";
          promptTextarea.style.cssText = "width:100%; height:100px; font-size:0.9em; box-sizing:border-box; resize:vertical;";
          const promptSaveBtn = document.createElement("button");
          promptSaveBtn.textContent = "保存";
          promptSaveBtn.style.cssText = "margin-top:4px; margin-right:4px; font-size:0.85em;";
          const promptCancelBtn = document.createElement("button");
          promptCancelBtn.textContent = "キャンセル";
          promptCancelBtn.style.cssText = "margin-top:4px; font-size:0.85em;";
          promptEditArea.appendChild(nameLabel);
          promptEditArea.appendChild(nameInput);
          promptEditArea.appendChild(promptLabel);
          promptEditArea.appendChild(promptTextarea);
          promptEditArea.appendChild(document.createElement("br"));
          promptEditArea.appendChild(promptSaveBtn);
          promptEditArea.appendChild(promptCancelBtn);
          div.appendChild(promptEditArea);
          div.querySelector(".edit-prompt-btn").onclick = () => {
            const isOpen = promptEditArea.style.display !== "none";
            promptEditArea.style.display = isOpen ? "none" : "block";
            if (!isOpen) {
              nameInput.value = p.name || "";
              promptTextarea.value = p.systemPrompt || "";
              nameInput.focus();
            }
          };
          promptCancelBtn.onclick = () => {
            promptEditArea.style.display = "none";
          };
          promptSaveBtn.onclick = async () => {
            const newName = nameInput.value.trim();
            const newPrompt = promptTextarea.value.trim();
            if (newName) {
              p.name = newName;
              div.querySelector(".project-item-title").textContent = newName;
              const headerSelect2 = document.getElementById("project-filter-select");
              if (headerSelect2) {
                const opt = headerSelect2.querySelector(`option[value="${p.id}"]`);
                if (opt) opt.textContent = newName;
              }
            }
            p.systemPrompt = newPrompt;
            p.updatedAt = Date.now();
            await window.dbUtils.updateProject(p);
            promptPreview.textContent = newPrompt || "（指示なし）";
            promptPreview.style.cssText = newPrompt ? "" : "color:var(--text-secondary,#888); font-style:italic;";
            promptEditArea.style.display = "none";
            if (window.state.activeProjectId === p.id) {
              window.state.currentSystemPrompt = newPrompt;
              const editor = document.getElementById("system-prompt-editor");
              if (editor) editor.value = newPrompt;
              if (window.appLogic && window.state.currentChatId) {
                await window.dbUtils.saveChat().catch(() => {
                });
              }
            }
          };
          const kSection = document.createElement("div");
          kSection.style.cssText = "margin-top:8px; border-top:1px solid rgba(128,128,128,0.2); padding-top:8px;";
          const kHeader = document.createElement("div");
          kHeader.style.cssText = "display:flex; align-items:center; justify-content:space-between; font-size:0.82em; color:var(--text-secondary, #888);";
          const kLabel = document.createElement("span");
          kLabel.textContent = `ナレッジ (${(p.knowledgeFiles || []).length}件)`;
          const kAddBtn = document.createElement("button");
          kAddBtn.className = "add-knowledge-btn";
          kAddBtn.dataset.id = p.id;
          kAddBtn.title = "ファイルを追加";
          kAddBtn.style.cssText = "background:none; border:none; cursor:pointer; padding:2px; color:inherit; display:flex; align-items:center;";
          kAddBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">attach_file</span>';
          kHeader.appendChild(kLabel);
          kHeader.appendChild(kAddBtn);
          kSection.appendChild(kHeader);
          const kList = document.createElement("div");
          kList.style.cssText = "margin-top:4px;";
          (p.knowledgeFiles || []).forEach((f) => {
            const fDiv = document.createElement("div");
            fDiv.style.cssText = "font-size:0.8em; padding:2px 0;";
            const fRow = document.createElement("div");
            fRow.style.cssText = "display:flex; align-items:center; justify-content:space-between;";
            const fName = document.createElement("span");
            fName.textContent = `📄 ${f.name}`;
            fName.style.cssText = "overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;";
            const fBtns = document.createElement("div");
            fBtns.style.cssText = "display:flex; align-items:center; flex-shrink:0;";
            const fEdit = document.createElement("button");
            fEdit.className = "edit-knowledge-btn";
            fEdit.dataset.projectId = p.id;
            fEdit.dataset.fileName = f.name;
            fEdit.style.cssText = "background:none; border:none; cursor:pointer; padding:0 2px; color:inherit; display:flex; align-items:center;";
            fEdit.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">edit</span>';
            const fDel = document.createElement("button");
            fDel.className = "delete-knowledge-btn";
            fDel.dataset.projectId = p.id;
            fDel.dataset.fileName = f.name;
            fDel.style.cssText = "background:none; border:none; cursor:pointer; padding:0 2px; color:inherit; display:flex; align-items:center;";
            fDel.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
            fBtns.appendChild(fEdit);
            fBtns.appendChild(fDel);
            fRow.appendChild(fName);
            fRow.appendChild(fBtns);
            const fEditArea = document.createElement("div");
            fEditArea.style.cssText = "display:none; margin-top:4px;";
            const fTextarea = document.createElement("textarea");
            fTextarea.value = f.content || "";
            fTextarea.style.cssText = "width:100%; height:120px; font-size:0.9em; box-sizing:border-box; resize:vertical;";
            const fSaveBtn = document.createElement("button");
            fSaveBtn.textContent = "保存";
            fSaveBtn.style.cssText = "margin-top:4px; margin-right:4px; font-size:0.85em;";
            const fCancelBtn = document.createElement("button");
            fCancelBtn.textContent = "キャンセル";
            fCancelBtn.style.cssText = "margin-top:4px; font-size:0.85em;";
            fEditArea.appendChild(fTextarea);
            fEditArea.appendChild(document.createElement("br"));
            fEditArea.appendChild(fSaveBtn);
            fEditArea.appendChild(fCancelBtn);
            fEdit.onclick = () => {
              fTextarea.value = f.content || "";
              fEditArea.style.display = fEditArea.style.display === "none" ? "block" : "none";
            };
            fCancelBtn.onclick = () => {
              fEditArea.style.display = "none";
            };
            fSaveBtn.onclick = async () => {
              const projectId = parseInt(fSaveBtn.closest("[data-pid]")?.dataset.pid || fEdit.dataset.projectId, 10);
              const project = projectsCache.find((proj) => proj.id === parseInt(fEdit.dataset.projectId, 10));
              if (!project) return;
              const idx = (project.knowledgeFiles || []).findIndex((kf) => kf.name === f.name);
              if (idx >= 0) {
                project.knowledgeFiles[idx] = { ...project.knowledgeFiles[idx], content: fTextarea.value };
                await window.dbUtils.updateProject(project);
                if (window.state.activeProjectId === project.id) {
                  window.state.activeProjectKnowledge = project.knowledgeFiles;
                }
                f.content = fTextarea.value;
                fEditArea.style.display = "none";
              }
            };
            fDiv.appendChild(fRow);
            fDiv.appendChild(fEditArea);
            kList.appendChild(fDiv);
          });
          kSection.appendChild(kList);
          div.appendChild(kSection);
          listContainer.appendChild(div);
        });
        listContainer.querySelectorAll(".delete-project-btn").forEach((btn) => {
          btn.onclick = async () => {
            if (confirm("このプロジェクトを削除しますか？\n(紐づいているチャットデータ自体は削除されず、「すべてのプロジェクト」に表示されます)")) {
              await window.dbUtils.deleteProject(parseInt(btn.dataset.id, 10));
              await loadProjects();
              if (window.state.activeProjectId === parseInt(btn.dataset.id, 10)) {
                headerSelect.value = "";
                headerSelect.dispatchEvent(new Event("change"));
              }
            }
          };
        });
        async function extractPdfText(file) {
          if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
              const s = document.createElement("script");
              s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              s.onload = resolve;
              s.onerror = reject;
              document.head.appendChild(s);
            });
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
          const buf = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(" ");
            text += `[Page ${i}]
${pageText}

`;
          }
          return text.trim();
        }
        __name(extractPdfText, "extractPdfText");
        listContainer.querySelectorAll(".add-knowledge-btn").forEach((btn) => {
          btn.onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = ".txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.html,.css,.xml,.yaml,.yml,.toml,.log,.sh,.pdf";
            input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
            document.body.appendChild(input);
            input.onchange = async (e) => {
              document.body.removeChild(input);
              const projectId = parseInt(btn.dataset.id, 10);
              const project = projectsCache.find((p) => p.id === projectId);
              if (!project) return;
              const knowledgeFiles = project.knowledgeFiles ? [...project.knowledgeFiles] : [];
              for (const file of Array.from(e.target.files)) {
                let content;
                try {
                  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
                    content = await extractPdfText(file);
                  } else {
                    content = await file.text();
                  }
                } catch (err) {
                  alert(`${file.name} の読み込みに失敗しました: ${err.message}`);
                  continue;
                }
                const idx = knowledgeFiles.findIndex((f) => f.name === file.name);
                const entry = { name: file.name, content, addedAt: Date.now() };
                if (idx >= 0) knowledgeFiles[idx] = entry;
                else knowledgeFiles.push(entry);
              }
              project.knowledgeFiles = knowledgeFiles;
              await window.dbUtils.updateProject(project);
              if (window.state.activeProjectId === projectId) {
                window.state.activeProjectKnowledge = knowledgeFiles;
              }
              await loadProjects();
            };
            input.click();
          };
        });
        listContainer.querySelectorAll(".delete-knowledge-btn").forEach((btn) => {
          btn.onclick = async () => {
            const projectId = parseInt(btn.dataset.projectId, 10);
            const project = projectsCache.find((p) => p.id === projectId);
            if (!project) return;
            project.knowledgeFiles = (project.knowledgeFiles || []).filter((f) => f.name !== btn.dataset.fileName);
            await window.dbUtils.updateProject(project);
            if (window.state.activeProjectId === projectId) {
              window.state.activeProjectKnowledge = project.knowledgeFiles;
            }
            await loadProjects();
          };
        });
      }
      __name(loadProjects, "loadProjects");
      headerSelect.addEventListener("change", async (e) => {
        if (e.target.value === "manage") {
          e.target.value = window.state.activeProjectId || "";
          dialog.showModal();
          return;
        }
        window.state.activeProjectId = e.target.value ? parseInt(e.target.value, 10) : null;
        window.dbUtils.saveSetting("activeProjectId", window.state.activeProjectId).catch(() => {
        });
        const switchedP = window.state.activeProjectId ? projectsCache.find((p) => p.id === window.state.activeProjectId) : null;
        window.state.activeProjectKnowledge = switchedP ? switchedP.knowledgeFiles || [] : [];
        if (window.uiUtils && typeof window.uiUtils.loadHistoryList === "function") {
          await window.uiUtils.loadHistoryList();
        }
        if (!window.state.currentChatId && window.appLogic && window.appLogic.startNewChat) {
          window.appLogic.startNewChat();
        }
      });
      const createBtn = document.getElementById("create-project-btn");
      if (createBtn) {
        createBtn.onclick = async () => {
          const nameInput = document.getElementById("new-project-name");
          const promptInput = document.getElementById("new-project-prompt");
          const modelInput = document.getElementById("new-project-model");
          if (!nameInput.value.trim()) {
            alert("プロジェクト名を入力してください。");
            return;
          }
          const newProject = {
            name: nameInput.value.trim(),
            systemPrompt: promptInput.value.trim(),
            defaultModel: modelInput ? modelInput.value : "",
            createdAt: Date.now()
          };
          await window.dbUtils.addProject(newProject);
          nameInput.value = "";
          promptInput.value = "";
          if (modelInput) modelInput.value = "";
          await loadProjects();
        };
      }
      const closeBtn = document.getElementById("close-project-dialog-btn");
      if (closeBtn) {
        closeBtn.onclick = () => dialog.close();
      }
      const mainSelect = document.getElementById("model-name");
      const projModelSelect = document.getElementById("new-project-model");
      if (mainSelect && projModelSelect) {
        const syncModelOpts = /* @__PURE__ */ __name(() => {
          const currentVal = projModelSelect.value;
          projModelSelect.innerHTML = '<option value="">(グローバル設定に従う)</option>' + mainSelect.innerHTML;
          projModelSelect.value = currentVal;
        }, "syncModelOpts");
        new MutationObserver(syncModelOpts).observe(mainSelect, { childList: true, subtree: true });
        setTimeout(syncModelOpts, 1e3);
      }
      if (window.dbUtils && window.dbUtils.getSetting) {
        const savedProject = await window.dbUtils.getSetting("activeProjectId");
        if (savedProject && savedProject.value != null) {
          window.state.activeProjectId = savedProject.value;
        }
      }
      await loadProjects();
      if (window.state.activeProjectId) {
        const activeP = projectsCache.find((p) => p.id === window.state.activeProjectId);
        if (activeP) {
          window.state.activeProjectKnowledge = activeP.knowledgeFiles || [];
        }
      }
    }
    __name(initProjectManager, "initProjectManager");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(initProjectManager, 800));
    } else {
      setTimeout(initProjectManager, 800);
    }
  })();
  (() => {
    const initPhase7 = /* @__PURE__ */ __name(() => {
      const customGroup = document.getElementById("user-defined-models-group");
      const mainSelect = document.getElementById("model-name");
      const fetchModelsBtn = document.getElementById("fetch-all-models-btn");
      if (fetchModelsBtn) {
        fetchModelsBtn.addEventListener("click", async () => {
          fetchModelsBtn.disabled = true;
          fetchModelsBtn.textContent = "取得中...";
          const results = [];
          function mergeModels(provider, newModels) {
            if (!newModels.length) return;
            if (!state.settings.fetchedModels) state.settings.fetchedModels = {};
            state.settings.fetchedModels[provider] = newModels;
          }
          __name(mergeModels, "mergeModels");
          async function fetchOpenAICompat(url, apiKey, provider, filter) {
            try {
              const r = await fetch(url, { headers: { "Authorization": `Bearer ${apiKey}` } });
              if (!r.ok) {
                results.push(`${provider}: HTTP ${r.status}`);
                return;
              }
              const d = await r.json();
              const models = (d.data || []).map((m) => m.id).filter((id) => id && (!filter || filter(id)));
              mergeModels(provider, models);
              results.push(`${provider}: ${models.length}件`);
            } catch (e) {
              results.push(`${provider}: エラー (${e.message})`);
            }
          }
          __name(fetchOpenAICompat, "fetchOpenAICompat");
          if (state.settings.apiKey) {
            try {
              const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${state.settings.apiKey}&pageSize=100`);
              if (r.ok) {
                const d = await r.json();
                const models = (d.models || []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace("models/", "")).filter((id) => id.includes("gemini"));
                mergeModels("gemini", models);
                results.push(`Gemini: ${models.length}件`);
              } else {
                results.push(`Gemini: HTTP ${r.status}`);
              }
            } catch (e) {
              results.push(`Gemini: エラー`);
            }
          }
          if (state.settings.anthropicApiKey) {
            try {
              const r = await fetch("https://api.anthropic.com/v1/models?limit=100", {
                headers: { "x-api-key": state.settings.anthropicApiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
              });
              if (r.ok) {
                const d = await r.json();
                const models = (d.data || []).map((m) => m.id);
                mergeModels("anthropic", models);
                results.push(`Anthropic: ${models.length}件`);
              } else {
                results.push(`Anthropic: HTTP ${r.status}`);
              }
            } catch (e) {
              results.push(`Anthropic: エラー`);
            }
          }
          if (state.settings.openaiApiKey) {
            await fetchOpenAICompat(
              "https://api.openai.com/v1/models",
              state.settings.openaiApiKey,
              "openai",
              (id) => /^(gpt|o\d|chatgpt)/i.test(id)
            );
          }
          const compatList = [
            { key: "groq", url: "https://api.groq.com/openai/v1/models", apiKey: state.settings.groqApiKey },
            { key: "deepseek", url: "https://api.deepseek.com/v1/models", apiKey: state.settings.deepseekApiKey },
            { key: "xai", url: "https://api.x.ai/v1/models", apiKey: state.settings.xaiApiKey },
            { key: "mistral", url: "https://api.mistral.ai/v1/models", apiKey: state.settings.mistralApiKey }
          ];
          for (const p of compatList) {
            if (p.apiKey) await fetchOpenAICompat(p.url, p.apiKey, p.key, null);
          }
          if (window.dbUtils && typeof window.dbUtils.saveSetting === "function") {
            window.dbUtils.saveSetting("fetchedModels", state.settings.fetchedModels).catch(() => {
            });
          }
          const apiProvSelect2 = document.getElementById("api-provider");
          if (apiProvSelect2) apiProvSelect2.dispatchEvent(new Event("change"));
          fetchModelsBtn.disabled = false;
          fetchModelsBtn.textContent = "🔄 全プロバイダーの最新モデルを取得";
          if (results.length) {
            alert("モデル取得完了:\n" + results.join("\n"));
          } else {
            alert("APIキーが設定されているプロバイダーが見つかりませんでした。");
          }
        });
      }
      const saveBtn = document.getElementById("save-settings-btn");
      if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
          if (window.state.activeProfile) {
            window.state.activeProfile.settings.openaiApiKey = state.settings.openaiApiKey;
            window.state.activeProfile.settings.anthropicApiKey = state.settings.anthropicApiKey;
            window.state.activeProfile.settings.customModelsText = state.settings.customModelsText;
            if (window.dbUtils && typeof window.dbUtils.updateProfile === "function") {
              await window.dbUtils.updateProfile(window.state.activeProfile);
            }
          }
          if (window.dbUtils && typeof window.dbUtils.saveSettings === "function") {
            await window.dbUtils.saveSettings(window.state.settings);
          }
          const originalText = saveBtn.innerText;
          saveBtn.innerText = "✓ 保存しました";
          saveBtn.style.backgroundColor = "#1a6b7a";
          setTimeout(() => {
            saveBtn.innerText = "設定を保存";
            saveBtn.style.backgroundColor = "#2196a8";
          }, 2e3);
        });
      }
      const persistCustomSetting = /* @__PURE__ */ __name(async (key, value) => {
        state.settings[key] = value;
        if (window.state.activeProfile) {
          window.state.activeProfile.settings[key] = value;
          if (window.dbUtils && typeof window.dbUtils.updateProfile === "function") {
            await window.dbUtils.updateProfile(window.state.activeProfile);
          }
        }
        if (window.dbUtils && typeof window.dbUtils.saveSettings === "function") {
          await window.dbUtils.saveSettings(window.state.settings);
        }
      }, "persistCustomSetting");
      const apiProvSelect = document.getElementById("api-provider");
      if (apiProvSelect) {
        const updateKeyVisibility = /* @__PURE__ */ __name(() => {
          const p = apiProvSelect.value;
          ["gemini", "zai", "openrouter", "bedrock", "openai", "anthropic", "groq", "deepseek", "xai", "mistral", "sakana"].forEach((prov) => {
            document.getElementById(`${prov}-api-key-container`)?.classList.toggle("hidden", p !== prov);
          });
        }, "updateKeyVisibility");
        apiProvSelect.addEventListener("change", updateKeyVisibility);
        setTimeout(updateKeyVisibility, 500);
      }
      const providers = ["gemini", "zai", "openrouter", "bedrock", "openai", "anthropic", "groq", "deepseek", "xai", "mistral", "sakana"];
      const defaultModelLists = {
        gemini: "gemini-2.0-flash, gemini-2.0-flash-lite-preview-02-05, gemini-2.0-pro-exp-02-05, gemini-1.5-pro, gemini-1.5-flash",
        openai: "gpt-4o, gpt-4o-mini, o1, o1-mini, o3-mini",
        anthropic: "claude-3-7-sonnet-20250219, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022",
        groq: "llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it",
        deepseek: "deepseek-chat, deepseek-reasoner",
        xai: "grok-3, grok-3-mini, grok-2-1212",
        mistral: "mistral-large-latest, mistral-small-latest, open-mistral-nemo",
        zai: "deepseek-v3, deepseek-r1",
        openrouter: "deepseek/deepseek-chat, deepseek/deepseek-r1, google/gemini-2.0-flash-001, anthropic/claude-3.5-sonnet",
        bedrock: "us.anthropic.claude-3-5-sonnet-20241022-v2:0, us.anthropic.claude-3-5-haiku-20241022-v1:0",
        sakana: "fugu, fugu-ultra"
      };
      state.settings.customModelsText = state.settings.customModelsText || {};
      state.settings.fetchedModels = state.settings.fetchedModels || {};
      state.settings.lastModelPerProvider = state.settings.lastModelPerProvider || {};
      let defaultsApplied = false;
      providers.forEach((prov) => {
        if (!state.settings.customModelsText[prov] && defaultModelLists[prov]) {
          state.settings.customModelsText[prov] = defaultModelLists[prov];
          defaultsApplied = true;
        }
      });
      if (defaultsApplied && window.state.activeProfile) {
        window.state.activeProfile.settings.customModelsText = state.settings.customModelsText;
        if (window.dbUtils && typeof window.dbUtils.updateProfile === "function") {
          window.dbUtils.updateProfile(window.state.activeProfile);
        }
      }
      if (state.settings.customModels && Array.isArray(state.settings.customModels)) {
        state.settings.customModels.forEach((cm) => {
          if (cm && cm.id && cm.provider) {
            const existing = state.settings.customModelsText[cm.provider] || "";
            if (!existing.includes(cm.id)) {
              state.settings.customModelsText[cm.provider] = existing ? `${existing}, ${cm.id}` : cm.id;
            }
          }
        });
        delete state.settings.customModels;
        if (window.dbUtils && typeof window.dbUtils.saveSettings === "function") window.dbUtils.saveSettings(window.state.settings);
      }
      const renderCustomModels = /* @__PURE__ */ __name(() => {
        if (customGroup) customGroup.innerHTML = "";
        providers.forEach((prov) => {
          const text = state.settings.customModelsText[prov] || "";
          const ids = text.split(",").map((s) => s.trim()).filter(Boolean);
          ids.forEach((id) => {
            if (customGroup) {
              const opt = document.createElement("option");
              opt.value = id;
              opt.textContent = `${id} (${prov})`;
              opt.dataset.provider = prov;
              opt.dataset.userDefined = "true";
              customGroup.appendChild(opt);
            }
          });
        });
      }, "renderCustomModels");
      providers.forEach((prov) => {
        const textarea = document.getElementById(`${prov}-custom-models`);
        if (textarea) {
          if (state.settings.customModelsText[prov]) {
            textarea.value = state.settings.customModelsText[prov];
          }
          textarea.addEventListener("change", async (e) => {
            state.settings.customModelsText[prov] = e.target.value;
            await persistCustomSetting("customModelsText", state.settings.customModelsText);
            renderCustomModels();
            apiProvSelect?.dispatchEvent(new Event("change"));
          });
        }
      });
      if (mainSelect && apiProvSelect) {
        mainSelect.addEventListener("change", async (e) => {
          const selectedOpt = mainSelect.options[mainSelect.selectedIndex];
          const newModel = mainSelect.value;
          let provider = null;
          if (selectedOpt && selectedOpt.dataset.provider) {
            provider = selectedOpt.dataset.provider;
          } else if (newModel.startsWith("gemini-")) {
            provider = "gemini";
          }
          if (provider && state.settings.apiProvider !== provider) {
            state.settings.apiProvider = provider;
            apiProvSelect.value = provider;
            apiProvSelect.dispatchEvent(new Event("change"));
            await persistCustomSetting("apiProvider", provider);
          }
        });
      }
      renderCustomModels();
    }, "initPhase7");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(initPhase7, 1200));
    } else {
      setTimeout(initPhase7, 1200);
    }
  })();
})();
