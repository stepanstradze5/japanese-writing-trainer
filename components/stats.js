class StatsScreen {
  constructor(app) {
    this.app = app;
  }

  show() {
    const stats = this.app.storage.getStats();

    const content = `
            <div class="stats-container">
                <h1 class="page-title">Статистика прогресса</h1>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3><i class="fas fa-japanese-yen"></i> Хирагана</h3>
                        <div class="stat-value">${stats.hiragana.total}</div>
                        <div class="stat-value small">всего ответов</div>
                        <div class="stat-value">${Math.round(stats.hiragana.accuracy)}%</div>
                        <div class="stat-value small">точность</div>
                    </div>
                    
                    <div class="stat-card">
                        <h3><i class="fas fa-language"></i> Катакана</h3>
                        <div class="stat-value">${stats.katakana.total}</div>
                        <div class="stat-value small">всего ответов</div>
                        <div class="stat-value">${Math.round(stats.katakana.accuracy)}%</div>
                        <div class="stat-value small">точность</div>
                    </div>

                    <div class="stat-card">
                      <h3><i class="fas fa-kanji"></i> Кандзи</h3>
                      <div class="stat-value">${stats.kanji.total}</div>
                      <div class="stat-value small">всего ответов</div>
                      <div class="stat-value">${Math.round(stats.kanji.accuracy)}%</div>
                      <div class="stat-value small">точность</div>
                      <div class="stat-value small" style="margin-top: 10px;">
                          Всего кандзи: ${stats.totalKanji}
                      </div>
                    </div>
      
                </div>
                
                <div id="detailed-stats" style="background: white; padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow); margin: 2rem 0;"></div>
                
                <div class="action-buttons">
                    <button class="btn btn-danger" onclick="app.resetProgress()">
                        <i class="fas fa-trash"></i> Сбросить прогресс
                    </button>
                    <button class="btn btn-warning" onclick="app.showMainMenu()">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                </div>
            </div>
        `;

    this.app.render(content);
    this.renderDetailedStats();
  }

  renderDetailedStats() {
    const weakHiragana = this.getWeakSymbols("hiragana", 5);
    const weakKatakana = this.getWeakSymbols("katakana", 5);
    const weakKanji = this.getWeakKanji(5);

    let detailedHTML = "";

    if (weakHiragana.length > 0) {
      detailedHTML += `
                <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
                    <i class="fas fa-exclamation-triangle"></i> Самые сложные символы хираганы:
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    ${weakHiragana
                      .map(
                        ([symbol, accuracy, progress]) => `
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--danger-color);">
                            <div style="font-size: 2rem; font-family: 'MS Gothic', monospace;">${symbol}</div>
                            <div style="color: var(--danger-color); font-weight: bold;">${accuracy}%</div>
                            <div style="font-size: 0.85rem; color: #666;">${progress.correct}/${progress.total}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
    }

    if (weakKatakana.length > 0) {
      detailedHTML += `
                <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
                    <i class="fas fa-exclamation-triangle"></i> Самые сложные символы катаканы:
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    ${weakKatakana
                      .map(
                        ([symbol, accuracy, progress]) => `
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); text-align: center; border-left: 4px solid var(--danger-color);">
                            <div style="font-size: 2rem; font-family: 'MS Gothic', monospace;">${symbol}</div>
                            <div style="color: var(--danger-color); font-weight: bold;">${accuracy}%</div>
                            <div style="font-size: 0.85rem; color: #666;">${progress.correct}/${progress.total}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
    }
    if (weakKanji.length > 0) {
      detailedHTML += `
        <h3 style="color: var(--secondary-color); margin-bottom: 1rem;">
            <i class="fas fa-exclamation-triangle"></i> Самые сложные кандзи:
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            ${weakKanji
              .map(
                ([kanji, accuracy, progress]) => `
                <div style="background: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); border-left: 4px solid var(--danger-color);">
                    <div style="font-size: 2rem; font-family: 'MS Gothic', monospace;">${kanji.kanji}</div>
                    <div style="color: var(--dark-text); margin-bottom: 0.5rem;">${kanji.russian}</div>
                    <div style="color: var(--danger-color); font-weight: bold;">${accuracy}%</div>
                    <div style="font-size: 0.85rem; color: #666;">${progress.correct}/${progress.total}</div>
                </div>
            `,
              )
              .join("")}
        </div>
    `;
    }

    document.getElementById("detailed-stats").innerHTML = detailedHTML;
  }

  getWeakSymbols(alphabet, limit) {
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    const symbols = Object.keys(data)
      .map((symbol) => {
        const progress = this.app.storage.getSymbolProgress(symbol);
        const accuracy = ProgressUtils.getAccuracy(progress);
        return [symbol, accuracy, progress];
      })
      .filter(([_, accuracy, progress]) => progress.total > 0) // Только те, что изучались
      .sort((a, b) => a[1] - b[1]) // Сортируем по возрастанию точности
      .slice(0, limit);

    return symbols;
  }
  getWeakKanji(limit) {
    const kanjiList = this.app.storage.kanjiList
      .map((kanji) => {
        const progress = this.app.storage.getKanjiProgress(kanji.kanji);
        const accuracy = ProgressUtils.getAccuracy(progress);
        return [kanji, accuracy, progress];
      })
      .filter(([_, accuracy, progress]) => progress.total > 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, limit);

    return kanjiList;
  }
}
