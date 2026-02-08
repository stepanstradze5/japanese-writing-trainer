class WritingTrainingScreen {
  constructor(app) {
    this.app = app;
    this.currentSymbol = null;
    this.selectedSymbols = [];
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.recentSymbols = [];
    this.showingAnswer = false;
  }

  show(symbols) {
    this.selectedSymbols = symbols;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.recentSymbols = [];
    this.showingAnswer = false;

    const content = `
            <div class="training-container">
                <div class="stats-display">
                    <div>
                        <i class="fas fa-chart-bar"></i>
                        Правильно: <span id="correct-count">0</span>/<span id="total-count">0</span> 
                        (<span id="accuracy">0</span>%)
                    </div>
                </div>
                
                <div class="writing-instruction">
                    <i class="fas fa-pencil-alt"></i>
                    <strong>Инструкция:</strong> Напишите символ в тетради по представленному ромадзи. 
                    После написания нажмите "Проверить", чтобы увидеть правильный ответ.
                </div>
                
                <div class="question-display" id="question-romaji"></div>

                <div class="action-buttons" style="margin-top: 20px;">
                    <button class="btn btn-warning" onclick="app.writing.showReference('hiragana')">
                        <i class="fas fa-pen-alt"></i> Таблица хираганы
                    </button>
                    <button class="btn btn-warning" onclick="app.writing.showReference('katakana')">
                        <i class="fas fa-pen-fancy"></i> Таблица катаканы
                    </button>
                </div>
                
                <div class="symbol-info" id="symbol-info"></div>
                
                <div id="check-section">
                    <button class="btn btn-primary" onclick="app.writing.showAnswer()">
                        <i class="fas fa-eye"></i> Показать ответ
                    </button>
                </div>
                
                <div id="answer-section" style="display: none;">
                    <div class="answer-display" id="correct-symbol"></div>
                    <p class="symbol-info">
                        Сравните ваш ответ с правильным символом:
                    </p>
                    <div class="result-message" style="margin: 1rem 0;">
                        Вы правильно написали символ?
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="app.writing.submitAnswer(true)">
                            <i class="fas fa-check"></i> Да, правильно
                        </button>
                        <button class="btn btn-danger" onclick="app.writing.submitAnswer(false)">
                            <i class="fas fa-times"></i> Нет, ошибся
                        </button>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="app.writing.nextQuestion()">
                        <i class="fas fa-forward"></i> Следующий
                    </button>
                    <button class="btn btn-danger" onclick="app.writing.finish()">
                        <i class="fas fa-stop"></i> Завершить
                    </button>
                </div>
                
                <div class="result-message" id="result-message"></div>
            </div>
        `;

    this.app.render(content);
    this.nextQuestion();
  }

  nextQuestion() {
    this.currentSymbol = this.getNextSymbol();
    if (!this.currentSymbol) {
      this.finish();
      return;
    }

    this.showingAnswer = false;

    const romaji = this.getRomaji(this.currentSymbol);
    const progress = this.app.storage.getSymbolProgress(this.currentSymbol);
    const accuracy = ProgressUtils.getAccuracy(progress);

    document.getElementById("question-romaji").textContent = romaji;
    document.getElementById("correct-symbol").textContent = this.currentSymbol;
    document.getElementById("result-message").textContent = "";
    document.getElementById("symbol-info").innerHTML = `
            <div>
                <i class="fas fa-chart-line"></i>
                Точность: <strong>${accuracy}%</strong> | 
                Всего попыток: <strong>${progress.total}</strong> | 
                Правильных: <strong>${progress.correct}</strong>
            </div>
        `;

    // Показываем секцию проверки, скрываем секцию ответа
    document.getElementById("check-section").style.display = "block";
    document.getElementById("answer-section").style.display = "none";

    // Добавляем в недавние символы
    this.recentSymbols.push(this.currentSymbol);
    if (this.recentSymbols.length > 5) {
      this.recentSymbols.shift();
    }
  }

  getNextSymbol() {
    if (this.selectedSymbols.length === 0) return null;

    // Убираем последний символ
    const available = this.selectedSymbols.filter(
      (s) =>
        s !== this.currentSymbol && !this.recentSymbols.slice(-2).includes(s),
    );

    if (available.length === 0) {
      available.push(
        ...this.selectedSymbols.filter((s) => s !== this.currentSymbol),
      );
      if (available.length === 0) {
        available.push(...this.selectedSymbols);
      }
    }

    return ProgressUtils.getWeightedRandom(
      available,
      (symbol) => this.app.storage.getSymbolProgress(symbol),
      this.recentSymbols,
    );
  }

  getRomaji(symbol) {
    const alphabet = this.app.currentAlphabet;
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    return data[symbol];
  }

  showAnswer() {
    this.showingAnswer = true;
    document.getElementById("check-section").style.display = "none";
    document.getElementById("answer-section").style.display = "block";

    // Показываем подсказку по написанию
    const symbol = this.currentSymbol;
    const romaji = this.getRomaji(symbol);
    const infoEl = document.getElementById("symbol-info");
    infoEl.innerHTML += `
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <i class="fas fa-lightbulb"></i>
                <strong>Подсказка:</strong> Символ "${symbol}" читается как "${romaji}"
            </div>
        `;
  }

  submitAnswer(isCorrect) {
    this.totalQuestions++;

    if (isCorrect) {
      this.correctAnswers++;
      this.showResult(
        '<i class="fas fa-check-circle"></i> Засчитано как правильный ответ!',
        "result-correct",
      );
    } else {
      this.showResult(
        '<i class="fas fa-times-circle"></i> Засчитано как ошибка',
        "result-incorrect",
      );
    }

    // Сохраняем прогресс
    this.app.storage.updateSymbolProgress(this.currentSymbol, isCorrect);

    // Обновляем статистику
    this.updateStats();

    // Переходим к следующему вопросу через 1.5 секунды
    setTimeout(() => this.nextQuestion(), 1500);
  }

  showResult(message, className) {
    const resultEl = document.getElementById("result-message");
    resultEl.innerHTML = message;
    resultEl.className = `result-message ${className}`;
  }

  updateStats() {
    const accuracy =
      this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;

    document.getElementById("correct-count").textContent = this.correctAnswers;
    document.getElementById("total-count").textContent = this.totalQuestions;
    document.getElementById("accuracy").textContent = accuracy;
  }

  finish() {
    let statsText = `<h3>Результаты тренировки письма</h3><hr>`;
    statsText += `<p><strong>Всего вопросов:</strong> ${this.totalQuestions}</p>`;
    statsText += `<p><strong>Правильных ответов:</strong> ${this.correctAnswers}</p>`;

    const accuracy =
      this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;
    statsText += `<p><strong>Процент правильных:</strong> ${accuracy}%</p>`;

    this.showModal("Статистика тренировки письма", statsText);
  }

  showModal(title, content) {
    const modalContainer = document.getElementById("modal-container");
    const modalOverlay = document.getElementById("modal-overlay");

    modalContainer.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <div class="modal-content">${content}</div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="app.showSelectionScreen(); Utils.hideModal();">
                    <i class="fas fa-redo"></i> Новая тренировка
                </button>
                <button class="btn btn-danger" onclick="Utils.hideModal(); app.showMainMenu();">
                    <i class="fas fa-home"></i> В главное меню
                </button>
            </div>
        `;

    modalContainer.style.display = "block";
    modalOverlay.style.display = "block";
  }

  showReference(alphabet) {
    const title =
      alphabet === "hiragana"
        ? "Таблица хираганы с порядком начертания"
        : "Таблица катаканы с порядком начертания";
    const imageUrl =
      alphabet === "hiragana"
        ? "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Table_hiragana-ru.svg/1200px-Table_hiragana-ru.svg.png"
        : "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Table_katakana.svg/1280px-Table_katakana.svg.png";

    const content = `
        <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
            <i class="fas fa-hand-point-up"></i> ${title}
        </h3>
        <p style="margin-bottom: 1.5rem; color: var(--dark-text);">
            Красными цифрами показан порядок начертания черт. Начинайте с цифры 1 и следуйте по порядку.
            Стрелки показывают направление движения ручки.
        </p>
        <div style="overflow-x: auto; max-height: 500px; border-radius: var(--border-radius); background: #f8f9fa; padding: 1rem;">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 style="max-width: 100%; height: auto; border-radius: var(--border-radius); box-shadow: var(--shadow);"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600/cccccc/666666?text=Таблица+загружается...';">
        </div>
        <div style="margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #fff9e6, #fff3cd); border-radius: var(--border-radius); border-left: 4px solid var(--warning-color);">
            <h4 style="color: #856404; margin-bottom: 0.5rem;">
                <i class="fas fa-lightbulb"></i> Как читать таблицу:
            </h4>
            <ul style="color: #856404; padding-left: 1.5rem;">
                <li><strong>Красные цифры</strong> - порядок черт</li>
                <li><strong>Стрелки</strong> - направление движения</li>
                <li><strong>Точки</strong> - начало черты</li>
                <li>Практикуйтесь, повторяя символ несколько раз</li>
            </ul>
        </div>
    `;

    const buttons = [
      {
        text: '<i class="fas fa-times"></i> Закрыть',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
      {
        text: `<i class="fas fa-pen"></i> Продолжить письмо`,
        class: "btn-primary",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal(title, content, buttons);
  }
}
