let defaultGameID="c83bf81f-2b3a-46f1-8449-2bc114125225";
let defaultLang="zh";


//遊戲ID
let GameID=getQueryParam('gameid')||defaultGameID;

//預設語言為中文 "zh"，可依情況更換為 "en"
let currentLang = getQueryParam('lang')||defaultLang;

//遊戲結束後前往指定網頁
let overUrl = "https://uat.hanaline.net/game/"+GameID;


let gameData;
let currentChapters = null;
let currentChaptersIndex=0;

let currentNode = null;
let currentNodeIndex=0;

let currentSubChapter = null;
let currentSubChapterIndex = 0;

let nextChaptersID;
let nextNodeID;
let nextSubChapterID;
let nextNodeType;



initUI();
changeLanguage(currentLang);
//document.getElementById("gameid-Panel").style.display = "none";
//loadGameData();

document.addEventListener("DOMContentLoaded", function () {
    const gameIdPanel = document.getElementById("gameid-Panel");
    const gameIdInput = document.getElementById("gameid-Panel-input");
    const logBtn = document.getElementById("toggle-log-btn");
    const logPanel = document.getElementById("dialogue-log");
    const musicBtn = document.getElementById("toggle-music-btn");
    const bgMusic = document.getElementById("bg-music");
    let logVisible = false;

    // 點擊開始遊戲
    gameIdPanel.addEventListener("click", function () {
        let inputGameID = gameIdInput.value.trim();
        if (inputGameID !== "") {
            GameID = inputGameID;
            gameIdPanel.style.display = "none";
            goFullScreen();
            loadGameData();
        } else {
            if (GameID !== "") {
                gameIdPanel.style.display = "none";
                goFullScreen();
                loadGameData();
            } else {
                alert("請輸入有效的遊戲 ID");
            }
        }
    });

    // 點擊對話紀錄按鈕
    logBtn.addEventListener("click", () => {
        logVisible = !logVisible;
        logPanel.style.display = logVisible ? "block" : "none";
    });

    // 點擊音樂開關按鈕
    musicBtn.addEventListener("click", function () {
        if (bgMusic.paused) {
            bgMusic.play().catch((error) => {
                console.warn("播放失敗，可能需要使用者互動", error);
            });
            musicBtn.textContent = "🔊"; // 播放中顯示靜音符號           
        } else {
            bgMusic.pause();
            musicBtn.textContent = "🔈"; // 暫停中顯示音樂符號            
        }
    });

    // 當頁面隱藏或返回桌面時自動暫停背景音樂
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            if (!bgMusic.paused) {
                bgMusic.pause();
                
            }
        } else {            
            if (bgMusic.src) {                
                bgMusic.play()
                .then(() => {                    
                    musicBtn.textContent = "🔊";
                })
                .catch((error) => {                    
                    console.warn("恢復播放失敗，可能需要使用者互動", error);
                    musicBtn.textContent = "🔈";             
                });
            }
            
        }
    });
});

/*
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("gameid-Panel").addEventListener("click", function () {
        let inputGameID = document.getElementById("gameid-Panel-input").value.trim();
        if (inputGameID !== "") {
            GameID = inputGameID;
            document.getElementById("gameid-Panel").style.display = "none";
            goFullScreen();
            loadGameData();
        } else {
            if (GameID !== "") 
            {
                document.getElementById("gameid-Panel").style.display = "none";
                goFullScreen();
                loadGameData();
            }
            else
                alert("請輸入有效的遊戲 ID");
        }
    });

    const logBtn = document.getElementById("toggle-log-btn");
    const logPanel = document.getElementById("dialogue-log");
    let logVisible = false;
    logBtn.addEventListener("click", () => {
        logVisible = !logVisible;
        logPanel.style.display = logVisible ? "block" : "none";
    });


});
*/
/*
async function loadGameData() {

    // 1. 若 localStorage 已有資料 → 直接用
    const cache = localStorage.getItem("gameData");
    if (cache) {
        console.log("使用 localStorage 的資料");
        const data = JSON.parse(cache);
        startGame(data);
        return;
    }

    // 2. 否則向 API 要
    const url = `https://api.hanaline.net/games/${GameID}/contents`;
    const response = await fetch(url);
    const data = await response.json();

    // 存起來
    localStorage.setItem("gameData", JSON.stringify(data));

    console.log("資料已從 API 取得並快取");
    console.log(data);
    startGame(data);
}
*/



// 讀取 JSON
async function loadGameData() { 
  try {
    const url = `https://api.hanaline.net/games/${GameID}/contents`;
    console.log("loadGameData url:", url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // 跟你 header 裡的一樣（不要漏掉 Basic 兩個字）
        'Authorization': 'Basic aGFuYWxpbmU6aWNjdA==',
      },
      
      credentials: 'include',
    });

    console.log("response status:", response.status);

    // 先把錯誤情況的文字抓出來看
    if (!response.ok) {
      const errorText = await response.text();
      console.error("後端錯誤內容：", errorText);
      throw new Error(`API 錯誤：${response.status}`);
    }

    // status OK 的情況再 parse JSON
    gameData = await response.json();
    console.log("gameData:", gameData);

    if (!gameData || !gameData.chapters || gameData.chapters.length === 0) {
      throw new Error("遊戲數據格式錯誤或為空");
    }

    startGame();
  } catch (error) {
    console.error("載入遊戲資料失敗", error);
    document.getElementById("dialogue-text").innerText = "遊戲載入失敗，請檢查資料";
  }
}


// 啟動遊戲
function startGame() {
    document.getElementById("game-Panel").style.display = "block";
    currentChapters=gameData.chapters[currentChaptersIndex];
    currentNode = currentChapters.detail.node[currentNodeIndex];
    currentSubChapter=currentNode[currentSubChapterIndex];
    updateScene();
    playBackgroundMusic();
}

// 更新畫面
function updateScene() {
    if (!currentNode) {
        console.error("章節資料錯誤", currentNode);
        document.getElementById("dialogue-text").innerText = "發生錯誤，請檢查遊戲內容";
        return;
    }

    let qacontainer = document.getElementById("qa-Panel");
    if (qacontainer) qacontainer.style.display = "none";

    let restartButton = document.getElementById("restart-button");
    if (restartButton) restartButton.style.display = "none";

    // 根據 `type` 顯示對應內容
    if (currentNode.type === "story") {
        showStoryScene();
    } else if (currentNode.type === "qa") {
        //判斷是否有提示
        

        //顯示題目
        showQuestionScene();

    } else if (currentNode.type === "end") {
        let nextChapters = findChaptersById(currentChapters.next)
        if(!nextChapters)
            endGame();
        else
        {
            currentChapters=nextChapters;
            currentNodeIndex=0;
            currentNode = currentChapters.detail.node[currentNodeIndex];
            currentSubChapterIndex=0;
            currentSubChapter=currentNode[currentSubChapterIndex];
            updateScene();
        }
    }
}

//Debug UI
function DebugUI()
{
    document.getElementById("debug-log").innerText =  
    "currentChaptersIndex: " + currentChaptersIndex + "\n" +
    "currentNodeIndex: " + currentNodeIndex + "\n" +
    "currentSubChapterIndex: " + currentSubChapterIndex + "\n" +
    "nextNodeID: " + nextNodeID + "\n" +
    "nextNodeType: " + nextNodeType;
}

// 顯示故事劇情
function showStoryScene() {

    //當前子節點資料
    let sceneData = currentNode.chapter[currentSubChapterIndex];

    if (!sceneData) {
        console.error("劇情資料錯誤", currentNode);
        return;
    }

    // 設定背景
    if (sceneData.backgroundImg) {
        document.getElementById("game-Panel").style.backgroundImage = `url(${gameData.backgroundImage.find(img => img.id === sceneData.backgroundImgId).url})`;
    } else {
        document.getElementById("game-Panel").style.backgroundImage = "none";
    }

    // 設定角色名稱
    let character = gameData.characters.find(cha => cha.id === sceneData.personId);
    document.getElementById("dialogue-name").innerText = character ? character.name : "旁白";
    
    if(character)
        document.getElementById("dialogue-name").style.display="block";
    else
        document.getElementById("dialogue-name").style.display="none";

    // 設定角色圖片
    let characterImg = document.getElementById("character");
    if (sceneData.personImg) {
        characterImg.src = gameData.characters.find(img => img.id === sceneData.personId).url;
        characterImg.style.display = "block";
    } else {
        characterImg.style.display = "none";
    }

    // 設定語音
    let audioElement = document.getElementById("character-audio");
    if (sceneData.audioId) {
        let soundData = gameData.audio.find(sound => sound.id === sceneData.audioId);
        if (soundData) {
            audioElement.src = soundData.url;
            audioElement.play();
        } else {
            console.warn("找不到對應的語音 ID:", sceneData.audioId);
        }
    } else {
        audioElement.pause();
        audioElement.src = "";
    }

    // 加入對話紀錄    
    let name=character ? character.name : "旁白";
    if(sceneData.dialogueText!="")
    {
        addlog(name,sceneData.dialogueText);
    }

    
    // 逐字顯示對話
    typeWriterEffect(sceneData.dialogueText || " ", 50, () => {
        document.getElementById("next-button").style.display = "block"; // 當打字動畫結束後顯示「下一頁」按鈕
    });

    document.getElementById("next-button").style.display = "none"; // 動畫開始時先隱藏按鈕

    // 設定「下一頁」邏輯
    document.getElementById("next-button").onclick = nextScene;

    document.getElementById("dialogue-box").style.display = "block";
}


//背景音樂
function playBackgroundMusic() {
    let bgMusic = document.getElementById("bg-music");

    // 尋找背景音樂 ID，假設 gameData.sounds 存有背景音樂
    let bgSound = gameData.backgroundMusic;

    if (bgSound) {
        bgMusic.src = bgSound.url; // 設定音樂來源

        // 嘗試播放背景音樂
        let playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.warn("背景音樂無法自動播放，請點擊按鈕手動播放。");
                document.getElementById("play-music-btn").style.display = "block";
            });
        }
    } else {
        console.warn("找不到背景音樂 ID: background-music");
    }
}


// 逐字顯示對話文字
function typeWriterEffect(text, speed, callback) {
    let index = 0;
    const dialogueElement = document.getElementById("dialogue-text");
    dialogueElement.innerHTML = ""; // 清空原內容

    function type() {
        if (index < text.length) {
            dialogueElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, speed);
        } else if (callback) {
            callback(); // 當動畫完成後執行回調函數
        }
    }

    type();
}


//下一頁按鈕
function nextScene() {
    if (currentSubChapterIndex < currentNode.chapter.length - 1) {
        currentSubChapterIndex++;
    } else {
        let nextNode = findNodeById(currentNode.next);      
        console.log(currentNode.next);
        if (!nextNode) 
            {
                //判斷是否還有下個章節
                let nextChapters =findChaptersById(currentChapters.next);
                if (!nextChapters) 
                    return endGame();

                currentChapters=nextChapters;
                currentNodeIndex=0;
                currentNode = currentChapters.detail.node[currentNodeIndex];
                currentSubChapterIndex = 0;
            }
            
        
        currentNode = nextNode;
        currentSubChapterIndex = 0;
    }
    updateScene();
}


// 顯示問答場景
function showQuestionScene() {
    let questionData = currentNode.qa;
    if (!questionData) {
        console.error("問答資料錯誤", currentNode);
        return;
    }
    document.getElementById("qa-title").innerText = questionData.hint;

    // 加入對話紀錄
    addlog(t("questionTitle"),questionData.hint);


    let qaContainer = document.getElementById("qa-Panel");

    if (questionData.type === "choice") {
        // 選擇題
        questionData.answers.forEach(answer => {
            let answerButton = document.createElement("button");
            answerButton.classList.add("choice-button"); 

            if(answer.answer!="")
            {
                answerButton.innerText = answer.answer;            
                answerButton.onclick = () => {
                    handleQuestionAnswer(answer.answer);               
                    document.querySelectorAll(".choice-button").forEach(button => button.remove());
                };
                
                qaContainer.appendChild(answerButton);
            }
           
        });
    } else if (questionData.type === "shortAnswer") {
        // 短答案輸入
        let input = document.createElement("input");
        input.type = "text";
        input.id = "qa-Panel-input";
        qaContainer.appendChild(input);

        let submitButton = document.createElement("button");
        submitButton.classList.add("choice-button"); 
        submitButton.innerText = t("submit");
        submitButton.onclick = () => {
            handleQuestionAnswer(input.value);
            input.remove();
            submitButton.remove();
        };   

        qaContainer.appendChild(submitButton);
    } else if (questionData.type === "qrCode") {
        // QR Code 掃描
        let qrHint = document.createElement("p");
        qrHint.innerText = "請掃描指定的 QR Code";
        qaContainer.appendChild(qrHint);

        let qrInput = document.createElement("input");
        qrInput.type = "text";
        qrInput.id = "qa-Panel-input";
        qrInput.placeholder = "請輸入 QR Code";
        qaContainer.appendChild(qrInput);

        let qrSubmitButton = document.createElement("button");
        qrSubmitButton.classList.add("choice-button"); 
        qrSubmitButton.innerText = t("submit");
        qrSubmitButton.onclick = () => {
            let input = document.getElementById("qa-Panel-input").value.trim();
            handleQuestionAnswer(input);
            qrHint.remove();
            qrInput.remove();
            qrSubmitButton.remove();
        };
        qaContainer.appendChild(qrSubmitButton);
    }

    document.getElementById("dialogue-box").style.display = "none";
    //document.getElementById("next-button").style.display = "none";
    document.getElementById("qa-Panel").style.display = "block";
}


// 處理問答回答
function handleQuestionAnswer(answer) {

    // 加入對話紀錄
    addlog(t("answerTitle"),answer);

    //判斷答案順序與驗證邏輯
    for (let i = 0; i < currentNode.qa.answers.length; i++) {
        //先判斷答題類型        
        let answerObj = currentNode.qa.answers[i];
        let answerText;
        if(currentNode.qa.type=="choice"||currentNode.qa.type=="shortAnswer")
            answerText=answerObj.answer;
        else if(currentNode.qa.type=="qrCode")
        {
            answerText=answerObj.qrCode.data;
        }
        else
        {
            console.warn(`未知的 type: ${currentNode.qa.type}`);
        }

        let nextNode;
    
        switch (answerObj.operator) {
            case "=":
                let validAnswers = answerText.split(",").map(a => a.trim());
                if (validAnswers.includes(answer.trim())) {
                    nextNode = findNodeById(answerObj.next);
                }
                break;
    
            case "!=":
                if (answerText != answer) {
                    nextNode = findNodeById(answerObj.next);
                }
                break;
    
            case ">":
                if (parseFloat(answer) > parseFloat(answerText)) {
                    nextNode = findNodeById(answerObj.next);
                }
                break;
    
            case "<":
                if (parseFloat(answer) < parseFloat(answerText)) {
                    nextNode = findNodeById(answerObj.next);
                }
                break;
    
            case "else":
                // 若沒有其他條件符合，則執行 "else"
                nextNode = findNodeById(answerObj.next);
                console.log(nextNode);
                break;
    
            default:
                console.warn(`未知的 operator: ${answerObj.operator}`);
                break;
        }
    
        if (nextNode) {
            document.getElementById("qa-Panel").style.display = "none";
            document.getElementById("next-button").style.display = "block";
            currentNode = nextNode;
            updateScene();
            break; // 找到符合條件的答案後結束迴圈
        }
    }    
}

// 查找節點
function findNodeById(nodeId) {
    let foundIndex = gameData.chapters[currentChaptersIndex].detail.node.findIndex(n => n.id === nodeId);
    let foundNode = gameData.chapters.find(chap => chap.detail.node.some(n => n.id === nodeId));
    if (!foundNode) return null;    
    currentNodeIndex = foundIndex;
    return foundNode.detail.node.find(n => n.id === nodeId) || null;
}

// 查找章節
function findChaptersById(chaptersId) {
    let foundIndex = gameData.chapters.findIndex(chap => chap.id === chaptersId);
    let foundChapters = gameData.chapters.find(chap => chap.id === chaptersId);
    if (!foundChapters) return null;   
    currentChaptersIndex = foundIndex;
    return foundChapters;
}


//結束
function endGame(){
    document.getElementById("end-Panel").style.display = "block";
    document.getElementById("next-button").style.display = "none";
    let endButton = document.getElementById("end-button");
    endButton.onclick = returnMain;
}


//返回
function returnMain()
{    
    initUI();
    initGame();
    //document.getElementById("gameid-Panel").style.display = "block";

    //前往
    window.location.href = overUrl;
}

//初始化介面
function initUI()
{   
    document.getElementById("game-Panel").style.display = "none";
    document.getElementById("qa-Panel").style.display = "none";
    document.getElementById("end-Panel").style.display = "none";
}

//初始化遊戲
function initGame()
{   
    currentChaptersIndex=0;
    currentNodeIndex=0;
    currentSubChapterIndex=0;
}

function goFullScreen() {
    let element = document.documentElement; // 讓整個 HTML 進入全螢幕
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen(); // Firefox
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(); // Chrome, Safari
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen(); // Edge
    }
}


//切換語言
function changeLanguage(lang) {
    console.log("切換"+lang);
    currentLang = lang || currentLang;
  
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[currentLang][key]) {
        el.textContent = translations[currentLang][key];
      }
    });
  
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[currentLang][key]) {
        el.placeholder = translations[currentLang][key];
      }
    });
  }

function t(key) {
    return translations[currentLang][key] || key;
}

//對話紀錄
function addlog(speakerName,text)
{
    // 加入對話紀錄
    const logContent = document.getElementById("log-content");
    if (logContent) {
        const logLine = document.createElement("div");
        logLine.textContent = `${speakerName}：${text}`;
        logContent.appendChild(logLine);
        logContent.scrollTop = logContent.scrollHeight;
    }
}

function getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

