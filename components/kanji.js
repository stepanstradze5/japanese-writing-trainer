class KanjiScreen {
  constructor(app) {
    this.app = app;
    this.selectedKanji = new Set();
    this.searchQuery = ""; // Добавляем состояние для поиска
    this.filteredKanji = []; // Отфильтрованный список
  }

  show() {
    const kanjiList = this.app.storage.kanjiList;
    const learnedCount = this.getLearnedKanjiCount();

    // Инициализируем отфильтрованный список
    this.filteredKanji = [...kanjiList];

    const content = `
            <div class="words-container">
                <h1 class="page-title">Управление кандзи</h1>
                
                <div class="stats-display" style="margin-bottom: 20px;">
                    <div>
                        <i class="fas fa-kanji"></i>
                        Всего кандзи: <strong>${kanjiList.length}</strong> | 
                        Изучено: <strong>${learnedCount}</strong>
                    </div>
                </div>
                
                <!-- Панель поиска и кнопок -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
                    <div style="position: relative; flex: 1; max-width: 300px;">
                        <input type="text" 
                               id="kanji-search-input" 
                               placeholder="Поиск кандзи или перевода..." 
                               style="width: 100%; padding: 10px 40px 10px 15px; border: 2px solid var(--light-border); border-radius: var(--border-radius); font-size: 1rem;"
                               oninput="app.kanji.handleSearch(this.value)">
                        <i class="fas fa-search" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--light-text);"></i>
                    </div>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="app.kanji.showAddKanjiDialog()">
                            <i class="fas fa-plus"></i> Добавить кандзи
                        </button>
                        <button class="btn btn-success" onclick="app.kanji.startTraining()">
                            <i class="fas fa-play"></i> Начать тренировку
                        </button>
                    </div>
                </div>
                
                <!-- Панель управления выбором -->
                <div class="action-buttons" style="margin: 15px 0;">
                    <button class="btn btn-warning" onclick="app.kanji.selectAll()">
                        <i class="fas fa-check-double"></i> Выбрать всё
                    </button>
                    <button class="btn btn-warning" onclick="app.kanji.deselectAll()">
                        <i class="fas fa-times"></i> Снять всё
                    </button>
                    <button class="btn btn-danger" onclick="app.showMainMenu()">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                </div>
                
                <!-- Результаты поиска -->
                <div id="search-info" style="margin-bottom: 10px; color: var(--light-text); font-size: 0.9rem;"></div>
                
                <!-- Список кандзи -->
                <div class="words-list" id="kanji-list"></div>
            </div>
        `;

    this.app.render(content);
    this.renderKanjiList();
    this.selectedKanji.clear();
    this.updateSearchInfo();
  }

  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();

    if (!this.searchQuery) {
      // Если поиск пустой, показываем все кандзи
      this.filteredKanji = [...this.app.storage.kanjiList];
    } else {
      // Фильтруем по кандзи, переводу или кане
      this.filteredKanji = this.app.storage.kanjiList.filter((kanji) => {
        return (
          kanji.kanji.includes(this.searchQuery) ||
          kanji.russian.toLowerCase().includes(this.searchQuery) ||
          kanji.kana.toLowerCase().includes(this.searchQuery)
        );
      });
    }

    this.renderKanjiList();
    this.updateSearchInfo();
  }

  updateSearchInfo() {
    const total = this.app.storage.kanjiList.length;
    const filtered = this.filteredKanji.length;
    const searchInfo = document.getElementById("search-info");

    if (this.searchQuery) {
      if (filtered === 0) {
        searchInfo.innerHTML = `
                    <div style="color: var(--danger-color); padding: 10px; background: #f8f9fa; border-radius: var(--border-radius); text-align: center;">
                        <i class="fas fa-search"></i> По запросу "${this.searchQuery}" ничего не найдено
                    </div>
                `;
      } else if (filtered < total) {
        searchInfo.innerHTML = `
                    <div style="padding: 8px 15px; background: #e8f4fd; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
                        <i class="fas fa-filter"></i> Найдено ${filtered} из ${total} кандзи по запросу: "${this.searchQuery}"
                    </div>
                `;
      } else {
        searchInfo.innerHTML = "";
      }
    } else {
      searchInfo.innerHTML = "";
    }
  }

  renderKanjiList() {
    // Используем filteredKanji вместо kanjiList
    const kanjiListToRender = this.filteredKanji;
    const allKanji = this.app.storage.kanjiList;

    if (kanjiListToRender.length === 0) {
      let emptyMessage = "";
      if (allKanji.length === 0) {
        emptyMessage = `
                    <div class="word-item" style="text-align: center; padding: 3rem;">
                        <div class="word-info">
                            <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                            <h3 style="color: #666;">Список кандзи пуст</h3>
                            <p style="color: #999;">Добавьте первый кандзи, нажав кнопку "Добавить кандзи"</p>
                        </div>
                    </div>
                `;
      } else {
        emptyMessage = `
                    <div class="word-item" style="text-align: center; padding: 3rem;">
                        <div class="word-info">
                            <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                            <h3 style="color: #666;">Ничего не найдено</h3>
                            <p style="color: #999;">Попробуйте изменить поисковый запрос</p>
                            <button class="btn btn-primary" onclick="app.kanji.handleSearch('')" style="margin-top: 15px;">
                                <i class="fas fa-times"></i> Очистить поиск
                            </button>
                        </div>
                    </div>
                `;
      }

      document.getElementById("kanji-list").innerHTML = emptyMessage;
      return;
    }

    const listHTML = kanjiListToRender
      .map((kanji, filteredIndex) => {
        // Находим реальный индекс в основном массиве
        const realIndex = this.app.storage.kanjiList.findIndex(
          (k) => k.kanji === kanji.kanji,
        );

        const progress = this.app.storage.getKanjiProgress(kanji.kanji);
        const accuracy = ProgressUtils.getAccuracy(progress);
        const progressClass = ProgressUtils.getProgressColor(accuracy);
        const isSelected = this.selectedKanji.has(realIndex);

        // Подсветка результатов поиска
        let kanjiDisplay = kanji.kanji;
        let russianDisplay = kanji.russian;
        let kanaDisplay = kanji.kana;

        if (this.searchQuery) {
          // Подсвечиваем совпадения
          if (kanji.kanji.includes(this.searchQuery)) {
            kanjiDisplay = kanji.kanji.replace(
              new RegExp(`(${this.searchQuery})`, "gi"),
              '<mark style="background: #ffeb3b; padding: 0 2px;">$1</mark>',
            );
          }
          if (kanji.russian.toLowerCase().includes(this.searchQuery)) {
            russianDisplay = kanji.russian.replace(
              new RegExp(`(${this.searchQuery})`, "gi"),
              '<mark style="background: #ffeb3b; padding: 0 2px;">$1</mark>',
            );
          }
          if (kanji.kana.toLowerCase().includes(this.searchQuery)) {
            kanaDisplay = kanji.kana.replace(
              new RegExp(`(${this.searchQuery})`, "gi"),
              '<mark style="background: #ffeb3b; padding: 0 2px;">$1</mark>',
            );
          }
        }

        return `
                <div class="word-item">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <input type="checkbox" ${isSelected ? "checked" : ""} 
                               onchange="app.kanji.toggleKanjiSelection(${realIndex}, this.checked)"
                               style="transform: scale(1.2);">
                        <div class="word-info" style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 10px;">
                                <div class="word-japanese" style="font-size: 2.5rem;">${kanjiDisplay}</div>
                                <div style="color: #666;">
                                    <div><strong>Перевод:</strong> ${russianDisplay}</div>
                                    <div><strong>Кана:</strong> ${kanaDisplay}</div>
                                </div>
                            </div>
                            <div class="word-progress ${progressClass}" style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.85rem;">
                                <i class="fas fa-chart-line"></i> Точность: ${accuracy}% (${progress.correct}/${progress.total})
                            </div>
                        </div>
                    </div>
                    <div class="word-actions">
                        <button class="action-btn edit-btn" 
                                onclick="app.kanji.showEditKanjiDialog(${realIndex})"
                                title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" 
                                onclick="app.kanji.deleteKanji(${realIndex})"
                                title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    document.getElementById("kanji-list").innerHTML = listHTML;
  }

  // Обновляем метод selectAll - теперь выбираем из отфильтрованного списка
  selectAll() {
    const allKanji = this.app.storage.kanjiList;
    // Выбираем все кандзи из отфильтрованного списка
    this.filteredKanji.forEach((kanji) => {
      const realIndex = allKanji.findIndex((k) => k.kanji === kanji.kanji);
      if (realIndex !== -1) {
        this.selectedKanji.add(realIndex);
      }
    });
    this.renderKanjiList();
  }

  // Обновляем метод deselectAll - снимаем выбор со всех в отфильтрованном списке
  deselectAll() {
    const allKanji = this.app.storage.kanjiList;
    this.filteredKanji.forEach((kanji) => {
      const realIndex = allKanji.findIndex((k) => k.kanji === kanji.kanji);
      if (realIndex !== -1) {
        this.selectedKanji.delete(realIndex);
      }
    });
    this.renderKanjiList();
  }

  // Добавляем метод очистки поиска
  clearSearch() {
    this.searchQuery = "";
    this.filteredKanji = [...this.app.storage.kanjiList];
    document.getElementById("kanji-search-input").value = "";
    this.renderKanjiList();
    this.updateSearchInfo();
  }
  getLearnedKanjiCount() {
    return this.app.storage.kanjiList.filter((kanji) => {
      const progress = this.app.storage.getKanjiProgress(kanji.kanji);
      return progress.total > 0 && ProgressUtils.getAccuracy(progress) >= 80;
    }).length;
  }

  toggleKanjiSelection(index, isSelected) {
    if (isSelected) {
      this.selectedKanji.add(index);
    } else {
      this.selectedKanji.delete(index);
    }
  }

  startTraining() {
    const kanjiList = this.app.storage.kanjiList;
    let selectedKanji = [];

    if (this.selectedKanji.size > 0) {
      // Используем выбранные через чекбоксы
      selectedKanji = Array.from(this.selectedKanji).map(
        (idx) => kanjiList[idx],
      );
    } else {
      // Или все кандзи, если ничего не выбрано
      selectedKanji = kanjiList;
    }

    if (selectedKanji.length === 0) {
      Utils.showAlert("Выберите хотя бы один кандзи для тренировки!", "error");
      return;
    }

    this.app.startKanjiTraining(selectedKanji);
  }

  showAddKanjiDialog() {
    const content = `
            <div class="form-group">
                <label class="form-label">Кандзи (обязательно):</label>
                <input type="text" class="form-input" id="kanji-input" 
                       placeholder="例: 日" maxlength="4">
            </div>
            <div class="form-group">
                <label class="form-label">Перевод на русский (обязательно):</label>
                <input type="text" class="form-input" id="russian-input" 
                       placeholder="例: солнце, день">
            </div>
            <div class="form-group">
                <label class="form-label">Кана (хирагана/катакана, обязательно):</label>
                <input type="text" class="form-input" id="kana-input" 
                       placeholder="例: ひ, にち">
            </div>
        `;

    const buttons = [
      {
        text: '<i class="fas fa-save"></i> Сохранить',
        class: "btn-primary",
        onclick: "app.kanji.saveNewKanji()",
      },
      {
        text: '<i class="fas fa-times"></i> Отмена',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal("Добавить кандзи", content, buttons);
    document.getElementById("kanji-input").focus();
  }

  saveNewKanji() {
    const kanji = document.getElementById("kanji-input").value.trim();
    const russian = document.getElementById("russian-input").value.trim();
    const kana = document.getElementById("kana-input").value.trim();

    if (!kanji || !russian || !kana) {
      Utils.showAlert("Заполните все обязательные поля!", "error");
      return;
    }

    // Проверяем, нет ли уже такого кандзи
    if (this.app.storage.kanjiList.some((k) => k.kanji === kanji)) {
      Utils.showAlert("Такой кандзи уже есть в списке!", "error");
      return;
    }

    this.app.storage.addKanji(kanji, russian, kana);
    Utils.hideModal();
    this.show();
    Utils.showAlert("Кандзи успешно добавлен!", "success");
  }

  showEditKanjiDialog(index) {
    const kanji = this.app.storage.kanjiList[index];

    const content = `
            <div class="form-group">
                <label class="form-label">Кандзи:</label>
                <input type="text" class="form-input" id="kanji-input" value="${kanji.kanji}">
            </div>
            <div class="form-group">
                <label class="form-label">Перевод на русский:</label>
                <input type="text" class="form-input" id="russian-input" value="${kanji.russian}">
            </div>
            <div class="form-group">
                <label class="form-label">Кана:</label>
                <input type="text" class="form-input" id="kana-input" value="${kanji.kana}">
            </div>
        `;

    const buttons = [
      {
        text: '<i class="fas fa-save"></i> Сохранить',
        class: "btn-primary",
        onclick: `app.kanji.saveEditedKanji(${index})`,
      },
      {
        text: '<i class="fas fa-times"></i> Отмена',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal("Редактировать кандзи", content, buttons);
  }

  saveEditedKanji(index) {
    const kanji = document.getElementById("kanji-input").value.trim();
    const russian = document.getElementById("russian-input").value.trim();
    const kana = document.getElementById("kana-input").value.trim();

    if (!kanji || !russian || !kana) {
      Utils.showAlert("Заполните все поля!", "error");
      return;
    }

    this.app.storage.updateKanji(index, kanji, russian, kana);
    Utils.hideModal();
    this.show();
    Utils.showAlert("Кандзи обновлен!", "success");
  }

  deleteKanji(index) {
    const kanji = this.app.storage.kanjiList[index];
    if (confirm(`Удалить кандзи "${kanji.kanji}"?`)) {
      this.app.storage.deleteKanji(index);
      this.selectedKanji.delete(index);
      this.show();
      Utils.showAlert("Кандзи удален!", "success");
    }
  }
}
