class WordsScreen {
  constructor(app) {
    this.app = app;
  }

  show() {
    const words = this.app.storage.words;
    const learnedWords = this.getLearnedWordsCount();

    const content = `
            <div class="words-container">
                <h1 class="page-title">Управление словарем</h1>
                
                <div class="stats-display">
                    <div>
                        <i class="fas fa-book"></i>
                        Всего слов: <strong>${words.length}</strong> | 
                        Изучено: <strong>${learnedWords}</strong>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.words.showAddWordDialog()">
                        <i class="fas fa-plus"></i> Добавить слово
                    </button>
                    <button class="btn btn-success" onclick="app.startWordsTraining()">
                        <i class="fas fa-play"></i> Начать тренировку
                    </button>
                    <button class="btn btn-danger" onclick="app.showMainMenu()">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                </div>
                
                <div class="words-list" id="words-list"></div>
            </div>
        `;

    this.app.render(content);
    this.renderWordsList();
  }

  renderWordsList() {
    const words = this.app.storage.words;

    if (words.length === 0) {
      document.getElementById("words-list").innerHTML = `
                <div class="word-item" style="text-align: center; padding: 3rem;">
                    <div class="word-info">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <h3 style="color: #666;">Словарь пуст</h3>
                        <p style="color: #999;">Добавьте первое слово, нажав кнопку "Добавить слово"</p>
                    </div>
                </div>
            `;
      return;
    }

    const listHTML = words
      .map((word, index) => {
        const progress = this.app.storage.getWordProgress(word.japanese);
        const accuracy = ProgressUtils.getAccuracy(progress);
        const progressClass = ProgressUtils.getProgressColor(accuracy);
        const isLearned = progress.total > 0 && accuracy >= 80;

        return `
                <div class="word-item ${isLearned ? "learned" : ""}">
                    <div class="word-info">
                        <div class="word-japanese">${word.japanese}</div>
                        <div class="word-translation">${word.russian}</div>
                        ${word.romaji ? `<div class="word-romaji">${word.romaji}</div>` : ""}
                        <div class="word-progress ${progressClass}" style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.85rem; margin-top: 5px;">
                            <i class="fas fa-chart-line"></i> Точность: ${accuracy}% (${progress.correct}/${progress.total})
                        </div>
                    </div>
                    <div class="word-actions">
                        <button class="action-btn edit-btn" 
                                onclick="app.words.showEditWordDialog(${index})"
                                title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" 
                                onclick="app.words.deleteWord(${index})"
                                title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    document.getElementById("words-list").innerHTML = listHTML;
  }

  getLearnedWordsCount() {
    return this.app.storage.words.filter((word) => {
      const progress = this.app.storage.getWordProgress(word.japanese);
      return progress.total > 0 && ProgressUtils.getAccuracy(progress) >= 80;
    }).length;
  }

  showAddWordDialog() {
    const content = `
            <div class="form-group">
                <label class="form-label">Японское слово (хирагана/катакана):</label>
                <input type="text" class="form-input" id="japanese-input" 
                       placeholder="例: こんにちは">
            </div>
            <div class="form-group">
                <label class="form-label">Перевод на русский:</label>
                <input type="text" class="form-input" id="russian-input" 
                       placeholder="例: здравствуйте">
            </div>
            <div class="form-group">
                <label class="form-label">Ромадзи (необязательно):</label>
                <input type="text" class="form-input" id="romaji-input" 
                       placeholder="例: konnichiwa">
            </div>
        `;

    const buttons = [
      {
        text: '<i class="fas fa-save"></i> Сохранить',
        class: "btn-primary",
        onclick: "app.words.saveNewWord()",
      },
      {
        text: '<i class="fas fa-times"></i> Отмена',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal("Добавить слово", content, buttons);

    // Фокус на первом поле
    setTimeout(() => {
      document.getElementById("japanese-input").focus();
    }, 100);
  }

  saveNewWord() {
    const japanese = document.getElementById("japanese-input").value.trim();
    const russian = document.getElementById("russian-input").value.trim();
    const romaji = document.getElementById("romaji-input").value.trim();

    if (!japanese || !russian) {
      Utils.showAlert("Заполните японское слово и перевод!", "error");
      return;
    }

    // Проверяем, нет ли уже такого слова
    if (this.app.storage.words.some((w) => w.japanese === japanese)) {
      Utils.showAlert("Такое слово уже есть в словаре!", "error");
      return;
    }

    this.app.storage.addWord(japanese, russian, romaji);
    Utils.hideModal();
    this.show();
    Utils.showAlert("Слово успешно добавлено!", "success");
  }

  showEditWordDialog(index) {
    const word = this.app.storage.words[index];

    const content = `
            <div class="form-group">
                <label class="form-label">Японское слово (хирагана/катакана):</label>
                <input type="text" class="form-input" id="japanese-input" value="${word.japanese}">
            </div>
            <div class="form-group">
                <label class="form-label">Перевод на русский:</label>
                <input type="text" class="form-input" id="russian-input" value="${word.russian}">
            </div>
            <div class="form-group">
                <label class="form-label">Ромадзи (необязательно):</label>
                <input type="text" class="form-input" id="romaji-input" value="${word.romaji || ""}">
            </div>
        `;

    const buttons = [
      {
        text: '<i class="fas fa-save"></i> Сохранить',
        class: "btn-primary",
        onclick: `app.words.saveEditedWord(${index})`,
      },
      {
        text: '<i class="fas fa-times"></i> Отмена',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal("Редактировать слово", content, buttons);
  }

  saveEditedWord(index) {
    const japanese = document.getElementById("japanese-input").value.trim();
    const russian = document.getElementById("russian-input").value.trim();
    const romaji = document.getElementById("romaji-input").value.trim();

    if (!japanese || !russian) {
      Utils.showAlert("Заполните японское слово и перевод!", "error");
      return;
    }

    this.app.storage.updateWord(index, japanese, russian, romaji);
    Utils.hideModal();
    this.show();
    Utils.showAlert("Слово успешно обновлено!", "success");
  }

  deleteWord(index) {
    const word = this.app.storage.words[index];

    if (confirm(`Удалить слово "${word.japanese}" (${word.russian})?`)) {
      this.app.storage.deleteWord(index);
      this.show();
      Utils.showAlert("Слово удалено!", "success");
    }
  }
}


