// Массив для отслеживания изменений в рендеринге
var dirtyCells = [];

// Кэш для изображений
var imgCache = {};

/**
 * Создает текстуру для указанного типа поля
 *
 * @param {number} type - Тип поля из fieldTypes
 * @returns {string} ссылка на текстуру
 */
function getTileLink(type) {
  switch (type) {
    case fieldTypes.empty:
      return './images/tile-.png';
    case fieldTypes.wall:
      return './images/tile-W.png';
    case fieldTypes.hero:
      return './images/tile-P.png';
    case fieldTypes.sword:
      return './images/tile-SW.png';
    case fieldTypes.potion:
      return './images/tile-HP.png';
    case fieldTypes.enemy:
      return './images/tile-E.png';
    default:
      return './images/tile-.png';
  }
}

/**
 * Создает и загружает изображение с колбэком
 *
 * @param {number} type - Тип поля
 * @param {number} size - Размер изображения
 * @param {Function} callback - Функция обратного вызова
 */
function loadImage(type, size, callback) {
  var cacheKey = type + '_' + size;
  if (imgCache[cacheKey] && imgCache[cacheKey].complete) {
    callback(imgCache[cacheKey]);
    return;
  }

  if (!imgCache[cacheKey]) {
    var img = new Image();
    img.onload = function () {
      callback(img);
    };
    img.src = getTileLink(type);
    imgCache[cacheKey] = img;
  } else {
    imgCache[cacheKey].onload = function () {
      callback(imgCache[cacheKey]);
    };
  }
}

/**
 * Добавляет ячейку в список изменений для перерисовки
 *
 * @param {number} x - X координата ячейки
 * @param {number} y - Y координата ячейки
 */
function markCellDirty(x, y) {
  var cellKey = x + '_' + y;
  if (dirtyCells.indexOf(cellKey) === -1) {
    dirtyCells.push(cellKey);
  }
}

/**
 * Рендерит отдельную ячейку на canvas асинхронно
 *
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 * @param {number} x - X координата ячейки
 * @param {number} y - Y координата ячейки
 * @param {Function} callback - Функция обратного вызова
 */
function renderCellAsync(ctx, x, y, callback) {
  var fieldType = game.map[y][x];

  var pixelX = x * CELL_SIZE;
  var pixelY = y * CELL_SIZE;

  ctx.clearRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);

  var enemy = null;

  if (typeof fieldType === 'string' && fieldType.startsWith('enemy_')) {
    var enemyId = parseInt(fieldType.split('_')[1]);
    enemy = game.enemies.find(function (e) {
      return e.id === enemyId;
    });
    if (enemy) {
      fieldType = fieldTypes.enemy;
    }
  }

  loadImage(fieldType, CELL_SIZE, function (img) {
    ctx.drawImage(img, pixelX, pixelY, CELL_SIZE, CELL_SIZE);

    if (fieldType === fieldTypes.hero) {
      drawHealthBar(
        ctx,
        pixelX,
        pixelY,
        game.hero.health,
        MAX_HEALTH,
        '#4CAF50'
      );

      if (game.hero.hasSword) {
        drawSword(ctx, pixelX, pixelY);
      }
    }

    if (enemy) {
      drawHealthBar(ctx, pixelX, pixelY, enemy.health, MAX_HEALTH, '#F44336');
    }

    if (callback) {
      callback();
    }
  });
}

/**
 * Рисует маленькую шкалу здоровья на ячейке
 *
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 * @param {number} pixelX - X координата в пикселях
 * @param {number} pixelY - Y координата в пикселях
 * @param {number} currentHealth - Текущее здоровье
 * @param {number} maxHealth - Максимальное здоровье
 * @param {string} color - Цвет шкалы здоровья
 */
function drawHealthBar(ctx, pixelX, pixelY, currentHealth, maxHealth, color) {
  var barWidth = CELL_SIZE - 4;
  var barHeight = 3;
  var barX = pixelX + 2;
  var barY = pixelY + CELL_SIZE - 5;

  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  var healthPercentage = Math.max(0, currentHealth / maxHealth);
  var fillWidth = barWidth * healthPercentage;

  if (fillWidth > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, fillWidth, barHeight);
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

/**
 * Рисует маленький меч рядом с героем
 *
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 * @param {number} pixelX - X координата в пикселях
 * @param {number} pixelY - Y координата в пикселях
 */
function drawSword(ctx, pixelX, pixelY) {
  var swordX = pixelX + CELL_SIZE - 8;
  var swordY = pixelY + 2;

  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(swordX + 1, swordY, 2, 8);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(swordX, swordY + 8, 4, 2);
  ctx.fillStyle = '#654321';
  ctx.fillRect(swordX - 1, swordY + 7, 6, 1);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(swordX, swordY, 4, 10);
}

/**
 * Рендерит все ячейки карты асинхронно
 *
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 */
function renderAllCells(ctx) {
  var cellsToRender = [];

  // Собираем все ячейки для рендеринга
  for (var rowId = 0; rowId < MAP_HEIGHT; rowId++) {
    for (var colId = 0; colId < MAP_WIDTH; colId++) {
      cellsToRender.push({ x: colId, y: rowId });
    }
  }

  // Рендерим ячейки по очереди
  renderCellsSequentially(ctx, cellsToRender, 0);
}

/**
 * Рендерит ячейки последовательно
 *
 * @param {CanvasRenderingContext2D} ctx - Контекст canvas
 * @param {Array} cells - Массив ячеек для рендеринга
 * @param {number} index - Текущий индекс
 */
function renderCellsSequentially(ctx, cells, index) {
  if (index >= cells.length) return;

  var cell = cells[index];
  renderCellAsync(ctx, cell.x, cell.y, function () {
    // Переходим к следующей ячейке
    renderCellsSequentially(ctx, cells, index + 1);
  });
}

/**
 * Рендерит игру на canvas
 * Использует текстуры и оптимизированную перерисовку только измененных ячеек
 */
function render(forceRender) {
  console.log(game);
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  // Устанавливаем размеры canvas
  if (forceRender) {
    const containerWidth = document
      .getElementsByClassName('field')[0]
      ?.getBoundingClientRect().width;
    CELL_SIZE = containerWidth ? containerWidth / 40 : CELL_SIZE;
    canvas.style.width = MAP_WIDTH * CELL_SIZE + 'px';
    canvas.style.height = MAP_HEIGHT * CELL_SIZE + 'px';

    canvas.width = MAP_WIDTH * CELL_SIZE;
    canvas.height = MAP_HEIGHT * CELL_SIZE;
  }

  if (!forceRender) {
    for (var i = 0; i < dirtyCells.length; i++) {
      var cellKey = dirtyCells[i];
      var coords = cellKey.split('_');
      var x = parseInt(coords[0]);
      var y = parseInt(coords[1]);

      renderCellAsync(ctx, x, y);
    }
    dirtyCells = [];
  } else {
    // Первоначальная отрисовка всей карты
    renderAllCells(ctx);
  }

  updatePlayerHealth();
}

/**
 * Обновляет отображение здоровья игрока
 */
function updatePlayerHealth() {
  var healthElement = document.getElementById('player-health');
  var healthTextElement = document.getElementById('player-health-text');

  if (!healthElement || !healthTextElement || !game) return;

  var currentHealth = game.hero.health;
  var maxHealth = MAX_HEALTH;
  var percentage = Math.max(0, (currentHealth / maxHealth) * 100);

  healthElement.style.width = percentage + '%';
  healthTextElement.textContent = currentHealth + '/' + maxHealth;

  if (percentage > 60) {
    healthElement.style.background = '#4CAF50';
  } else if (percentage > 30) {
    healthElement.style.background = '#FF9800';
  } else {
    healthElement.style.background = '#F44336';
  }
}
