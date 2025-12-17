let scene = 0; // 控制場景：0=封面, 1-3=教學, 4=測驗開始, 5-7=題目, 8=結果
let score = 0;
let feedback = "";
let selectedOption = -1;
let isTransitioning = false;

// 獨立題庫
let questions = [];
let table;
let clickEffects = []; // 儲存點擊特效
let trail = [];        // 儲存滑鼠軌跡
let fireworks = [];    // 煙火粒子
let stars = [];        // 星星

let baseW = 600;
let baseH = 400;

function preload() {
  // 載入 CSV 檔案，設定 header 讓 p5.js 知道第一行是標題
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  resetQuiz();
}

function resetQuiz() {
  questions = [];
  fireworks = [];
  stars = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    
    // 取得原始選項與正確答案文字
    let originalOptions = [
      row.getString('option1'),
      row.getString('option2'),
      row.getString('option3')
    ];
    let correctIndex = row.getNum('answer') - 1; // CSV 是 1-based，轉為 0-based
    let correctText = originalOptions[correctIndex];

    // 隨機打亂選項
    let shuffledOptions = shuffle(originalOptions);
    // 找出正確答案在打亂後的新位置
    let newCorrectIndex = shuffledOptions.indexOf(correctText);

    let qData = {
      q: row.getString('question'),
      options: shuffledOptions,
      answer: newCorrectIndex
    };
    questions.push(qData);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(20, 20, 35); // 深色背景，符合 ACG 氛圍
  drawMouseEffects(); // 移至此處，確保特效在文字下方
  
  // 計算縮放比例，保持 600x400 比例
  let scaleFactor = Math.min(width / baseW, height / baseH);
  let offsetX = (width - baseW * scaleFactor) / 2;
  let offsetY = (height - baseH * scaleFactor) / 2;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  if (scene === 0) {
    showStartScreen();
  } else if (scene === 1) {
    showLesson("1. 什麼是 AMV？", "\nAMV (Anime Music Video) \n\n字面意思就是將動畫畫面與音樂\n進行重新剪輯後創作出來的新影片。\n\n它不是原創動畫\n而是一種「轉換性」的二次創作。");
  } else if (scene === 2) {
    showLesson("2. 核心靈魂：同步感", "完美的 AMV 講求「對拍 (Sync)」。\n\n當鼓點落下，畫面也剛好切換或發生爆炸，\n\n這種視覺與聽覺的統一感是 AMV 的魅力所在。");
  } else if (scene === 3) {
    showLesson("3. 合理使用與版權", "AMV 屬於法律上的灰色地帶。\n\n優秀的創作者應標明素材來源，\n\n且不應以此進行直接商業營利。");
  } else if (scene === 4) {
    showQuizIntro(offsetX, offsetY, scaleFactor);
  } else if (scene >= 5 && scene < 5 + questions.length) {
    let qIdx = scene - 5;
    askQuestion(questions[qIdx].q, questions[qIdx].options, questions[qIdx].answer, offsetX, offsetY, scaleFactor);
  } else if (scene === 5 + questions.length) {
    showResult();
  }
  
  drawFooter();
  pop();
}

// --- 場景函式 ---

function showStartScreen() {
  fill(255, 204, 0);
  textSize(50);
  text("AMV 相關知識", baseW/2, baseH/2 - 20);
  textSize(18);
  fill(255);
  text("點擊畫面以前進", baseW/2, baseH/2 + 40);
}

function showLesson(title, content) {
  fill(0, 150, 255);
  textSize(35);
  text(title, baseW/2, 80);
  fill(255);
  textSize(20);
  textLeading(30);
  text(content, baseW/2, baseH/2);
}

function showQuizIntro(offsetX, offsetY, scaleFactor) {
  fill(255, 100, 100);
  textSize(35);
  text("AMV知識小測驗", baseW/2, baseH/2 - 40);
  fill(255);
  textSize(18);
  text("準備好測試你的學習成果了嗎？", baseW/2, baseH/2 + 10);

  // 計算滑鼠在虛擬畫布上的位置
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  // 按鈕互動效果：檢查滑鼠是否在按鈕範圍內
  if (mx > baseW/2 - 80 && mx < baseW/2 + 80 && my > baseH/2 + 50 && my < baseH/2 + 100) {
    if (mouseIsPressed) {
      fill(0, 100, 200); // 按下時變深藍色
    } else {
      fill(50, 180, 255); // 懸停時變亮藍色
    }
  } else {
    fill(0, 150, 255); // 一般狀態藍色
  }
  rect(baseW/2 - 80, baseH/2 + 50, 160, 50, 10);
  fill(255);
  textSize(20);
  text("開始測驗", baseW/2, baseH/2 + 75);
}

function askQuestion(q, options, correctIdx, offsetX, offsetY, scaleFactor) {
  fill(255);
  textSize(24);
  text(q, baseW/2, 60);
  
  // 轉換滑鼠座標
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;
  
  for (let i = 0; i < options.length; i++) {
    let y = 150 + i * 60;
    
    if (selectedOption !== -1) {
      // 已答題：顯示結果狀態
      if (i === correctIdx) {
        fill(0, 255, 100); // 正確答案顯示綠色
      } else if (i === selectedOption) {
        fill(255, 100, 100); // 選錯時顯示紅色
      } else {
        fill(200); // 其他選項灰色
      }
    } else {
      // 未答題：互動模式
      if (mx > 150 && mx < 450 && my > y - 25 && my < y + 25) {
        fill(255, 204, 0); // 懸停黃色
        if (mouseIsPressed) {
          checkAnswer(i, correctIdx);
        }
      } else {
        fill(200);
      }
    }
    rect(150, y - 25, 300, 50, 10);
    fill(0);
    textSize(18);
    text(options[i], baseW/2, y);
  }
  
  fill(255, 255, 0);
  text(feedback, baseW/2, 350);
}

function checkAnswer(choice, correct) {
  if (selectedOption !== -1) return; // 防止重複點擊

  selectedOption = choice;
  if (choice === correct) {
    score++;
    feedback = "答對了！";
  } else {
    feedback = "可惜答錯了";
  }
  
  // 1秒後自動進入下一題
  setTimeout(() => {
    scene++;
    selectedOption = -1;
    feedback = "";
  }, 1000);
}

function showResult() {
  if (score === questions.length) {
    drawFireworks();
    drawStars();
  } else if (score > 0) {
    drawStars();
  } else {
    drawSeaweed();
  }

  fill(255);
  textSize(30);
  text("測驗結束！", baseW/2, baseH/2 - 50);
  textSize(50);
  fill(0, 255, 100);
  text("總分: " + score + " / " + questions.length, baseW/2, baseH/2 + 20);
  textSize(18);
  fill(200);
  text("點擊畫面重新開始", baseW/2, baseH/2 + 80);
}

function drawFooter() {
  let resultScene = 5 + questions.length;
  let totalScenes = resultScene + 1;
  fill(100);
  textSize(12);
  if (scene < 5 || scene === resultScene) {
    text("當前進度: " + (scene + 1) + " / " + totalScenes, baseW/2, 380);
  }
}

// --- 特效函式 ---

function drawMouseEffects() {
  push();
  // 1. 滑鼠軌跡
  trail.push({x: mouseX, y: mouseY, alpha: 200});
  if (trail.length > 10) trail.shift(); // 限制軌跡長度

  noStroke();
  for (let i = 0; i < trail.length; i++) {
    let p = trail[i];
    fill(100, 200, 255, p.alpha * (i / trail.length)); // 漸層消失
    ellipse(p.x, p.y, 8 + i, 8 + i);
  }

  // 2. 點擊波紋
  for (let i = clickEffects.length - 1; i >= 0; i--) {
    let e = clickEffects[i];
    noFill();
    stroke(255, 255, 100, e.alpha);
    strokeWeight(3);
    ellipse(e.x, e.y, e.size);
    e.size += 5; // 擴散速度
    e.alpha -= 10; // 消失速度
    if (e.alpha <= 0) clickEffects.splice(i, 1);
  }
  pop();
}

function drawFireworks() {
  if (frameCount % 30 === 0) { // 每半秒發射一次
    let exX = random(50, baseW - 50);
    let exY = random(50, baseH / 2);
    let col = color(random(100, 255), random(100, 255), random(100, 255));
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 6);
      fireworks.push({
        x: exX, y: exY,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        col: col
      });
    }
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    let p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // 重力
    p.alpha -= 3;
    fill(red(p.col), green(p.col), blue(p.col), p.alpha);
    noStroke();
    ellipse(p.x, p.y, 4);
    if (p.alpha <= 0) fireworks.splice(i, 1);
  }
}

function drawStars() {
  if (stars.length === 0) {
    for(let i=0; i<30; i++) {
      stars.push({x: random(baseW), y: random(baseH), size: random(5, 15), offset: random(100)});
    }
  }
  noStroke();
  for(let s of stars) {
    let alpha = 150 + 100 * sin(frameCount * 0.1 + s.offset);
    fill(255, 255, 100, alpha);
    
    // 繪製五角星
    push();
    translate(s.x, s.y);
    rotate(frameCount * 0.01 + s.offset);
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI * i / 5 - HALF_PI;
      let r1 = s.size;
      let r2 = s.size * 0.4;
      vertex(cos(angle) * r1, sin(angle) * r1);
      angle += TWO_PI / 10;
      vertex(cos(angle) * r2, sin(angle) * r2);
    }
    endShape(CLOSE);
    pop();
  }
}

function drawSeaweed() {
  for (let i = 0; i < 8; i++) {
    let xBase = 60 + i * 70;
    let h = 120 + (i % 3) * 30;
    fill(50 + i*20, 200, 150 + i*10, 150); // 彩色半透明
    noStroke();
    beginShape();
    // 左側向上
    for (let y = 0; y <= h; y += 10) {
      let xOff = sin(frameCount * 0.05 + i + y * 0.03) * (y/4); 
      vertex(xBase - 10 + xOff, baseH - y);
    }
    // 右側向下
    for (let y = h; y >= 0; y -= 10) {
      let xOff = sin(frameCount * 0.05 + i + y * 0.03) * (y/4);
      vertex(xBase + 10 + xOff, baseH - y);
    }
    endShape(CLOSE);
  }
}

// --- 互動邏輯 ---

function mousePressed() {
  // 加入點擊特效
  clickEffects.push({x: mouseX, y: mouseY, size: 10, alpha: 255});

  let resultScene = 5 + questions.length;
  
  // 計算虛擬滑鼠座標
  let scaleFactor = Math.min(width / baseW, height / baseH);
  let offsetX = (width - baseW * scaleFactor) / 2;
  let offsetY = (height - baseH * scaleFactor) / 2;
  let mx = (mouseX - offsetX) / scaleFactor;
  let my = (mouseY - offsetY) / scaleFactor;

  if (scene < 4) {
    scene++;
  } else if (scene === 4) {
    // 檢查是否點擊按鈕
    if (mx > baseW/2 - 80 && mx < baseW/2 + 80 && my > baseH/2 + 50 && my < baseH/2 + 100) {
      if (!isTransitioning) {
        isTransitioning = true;
        setTimeout(() => {
          scene++;
          isTransitioning = false;
        }, 1000);
      }
    }
  } else if (scene === resultScene) {
    scene = 0;
    score = 0;
    resetQuiz();
  }
}