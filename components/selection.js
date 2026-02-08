class SelectionScreen {
  constructor(app) {
    this.app = app;
    this.selectedSymbols = new Set();
  }

  show() {
    const alphabet = this.app.currentAlphabet;
    const isHiragana = alphabet === "hiragana";

    const content = `
            <div class="selection-container">
                <h1 class="page-title">Выберите символы для тренировки</h1>
                
                <div class="alphabet-selector">
                    <button class="alphabet-btn ${isHiragana ? "active" : ""}" 
                            onclick="app.switchAlphabet('hiragana')">
                        <i class="fas fa-japanese-yen"></i> Хирагана
                    </button>
                    <button class="alphabet-btn ${!isHiragana ? "active" : ""}" 
                            onclick="app.switchAlphabet('katakana')">
                        <i class="fas fa-language"></i> Катакана
                    </button>
                </div>
                
                <div class="selection-header">
                    <div class="selected-count" id="selected-count">
                        Выбрано: 0 символов
                    </div>
                    
                    <div class="group-buttons" id="group-buttons"></div>
                </div>
                
                <div class="symbols-grid" id="symbols-grid"></div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.startTraining()">
                        <i class="fas fa-play"></i> Начать тренировку
                    </button>
                    <button class="btn btn-warning" onclick="app.startWritingTraining()">
                        <i class="fas fa-pen"></i> Начать письмо
                    </button>
                    <button class="btn btn-danger" onclick="app.showMainMenu()">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                </div>
            </div>
        `;

    this.app.render(content);
    this.renderGroupButtons();
    this.renderSymbols();
    this.selectedSymbols.clear();
    this.updateSelectedCount();
  }

  renderGroupButtons() {
    const alphabet = this.app.currentAlphabet;
    const groups =
      alphabet === "hiragana" ? AppData.hiraganaGroups : AppData.katakanaGroups;

    const buttonsHTML = Object.entries(groups)
      .map(
        ([name, symbols]) => `
    <button class="group-btn" onclick="app.selection.selectGroup([${symbols.map((s) => `'${s}'`).join(",")}])">
        ${name}
    </button>
`,
      )
      .join("");

    document.getElementById("group-buttons").innerHTML =
      buttonsHTML +
      `
            <button class="group-btn" onclick="app.selection.selectAll()">
                <i class="fas fa-check-double"></i> Выбрать все
            </button>
            <button class="group-btn" onclick="app.selection.deselectAll()">
                <i class="fas fa-times"></i> Снять все
            </button>
        `;
  }

  renderSymbols() {
    const alphabet = this.app.currentAlphabet;
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;

    const symbolsHTML = Object.entries(data)
      .map(([symbol, romaji]) => {
        const progress = this.app.storage.getSymbolProgress(symbol);
        const accuracy = ProgressUtils.getAccuracy(progress);
        const progressClass = ProgressUtils.getProgressColor(accuracy);

        return `
                <div class="symbol-card ${this.selectedSymbols.has(symbol) ? "selected" : ""}" 
                     onclick="app.selection.toggleSymbol('${symbol}')"
                     title="${symbol} - ${romaji} (Точность: ${accuracy}%)">
                    <div class="symbol-progress ${progressClass}">
                        ${accuracy}%
                    </div>
                    <div class="symbol-char">${symbol}</div>
                    <div class="symbol-romaji">${romaji}</div>
                    <div class="symbol-stats">
                        <small>${progress.correct}/${progress.total}</small>
                    </div>
                </div>
            `;
      })
      .join("");

    document.getElementById("symbols-grid").innerHTML = symbolsHTML;
  }

  toggleSymbol(symbol) {
    if (this.selectedSymbols.has(symbol)) {
      this.selectedSymbols.delete(symbol);
    } else {
      this.selectedSymbols.add(symbol);
    }

    // Обновляем стиль карточки
    const cards = document.querySelectorAll(".symbol-card");
    cards.forEach((card) => {
      const char = card.querySelector(".symbol-char").textContent;
      if (char === symbol) {
        card.classList.toggle("selected", this.selectedSymbols.has(symbol));
      }
    });

    this.updateSelectedCount();
  }

  selectGroup(symbols) {
    symbols.forEach((symbol) => {
      this.selectedSymbols.add(symbol);
    });
    this.updateUI();
  }

  selectAll() {
    const alphabet = this.app.currentAlphabet;
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    this.selectedSymbols = new Set(Object.keys(data));
    this.updateUI();
  }

  deselectAll() {
    this.selectedSymbols.clear();
    this.updateUI();
  }

  updateUI() {
    const cards = document.querySelectorAll(".symbol-card");
    cards.forEach((card) => {
      const char = card.querySelector(".symbol-char").textContent;
      card.classList.toggle("selected", this.selectedSymbols.has(char));
    });
    this.updateSelectedCount();
  }

  updateSelectedCount() {
    const countEl = document.getElementById("selected-count");
    countEl.textContent = `Выбрано: ${this.selectedSymbols.size} символов`;
  }

  getSelectedSymbols() {
    return Array.from(this.selectedSymbols);
  }
}
