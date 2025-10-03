/**
 * Игровой движок - основная логика игры
 */

var game;

/**
 * Генерирует случайное число между от одного до другого включительно
 *
 * @param {number} from - От какого числа
 * @param {number} to - До какого числа
 * @returns {number} Случайное число
 */
function genRandFromTo(from, to) {
  return Math.floor(Math.random() * (to - from + 1)) + from;
}

/**
 * Генерирует случайные координаты поля на карте
 *
 * @returns {Object} Объект с координатами {x, y}
 */
function genRandomField() {
  var x = genRandFromTo(0, MAP_WIDTH - 1);
  var y = genRandFromTo(0, MAP_HEIGHT - 1);
  return { x: x, y: y };
}

/**
 * Проверяет пересечение прямоугольников комнат с учетом отступа
 *
 * @param {{x:number,y:number,width:number,height:number}} a
 * @param {{x:number,y:number,width:number,height:number}} b
 * @param {number} padding - необязательный отступ между комнатами
 * @returns {boolean} true если комнаты пересекаются/касаются (с учетом padding)
 */
/**
 * Проверяет пересечение или касание прямоугольников комнат с учетом отступа.
 *
 * @param {{x:number,y:number,width:number,height:number}} a - первая комната
 * @param {{x:number,y:number,width:number,height:number}} b - вторая комната
 * @param {number} [padding=0] - буфер (в ячейках) между комнатами
 * @returns {boolean} true, если комнаты пересекаются или касаются с учетом padding
 */
function rectanglesIntersect(a, b, padding) {
  padding = padding || 0;
  var aLeft = a.x - padding;
  var aRight = a.x + a.width - 1 + padding;
  var aTop = a.y - padding;
  var aBottom = a.y + a.height - 1 + padding;

  var bLeft = b.x - padding;
  var bRight = b.x + b.width - 1 + padding;
  var bTop = b.y - padding;
  var bBottom = b.y + b.height - 1 + padding;

  var separated =
    aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom;
  return !separated;
}

/**
 * Генерирует случайные комнаты на карте
 * Создает прямоугольные области, заполненные пустыми полями
 */
/**
 * Генерирует комнаты без пересечений и касаний (буфер 1 клетка).
 * Сохраняет созданные комнаты в this.rooms и вырезает пустоту в this.map.
 *
 * @returns {void}
 */
function genRooms() {
  var roomsCount = genRandFromTo(MIN_ROOMS, MAX_ROOMS);
  this.rooms = [];

  // Максимум попыток, чтобы избежать бесконечного цикла на тесных картах
  var maxAttempts = roomsCount * 10;
  var attempts = 0;

  while (this.rooms.length < roomsCount && attempts < maxAttempts) {
    attempts++;
    var roomWidth = genRandFromTo(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    var roomHeight = genRandFromTo(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    var roomX = genRandFromTo(0, MAP_WIDTH - roomWidth);
    var roomY = genRandFromTo(0, MAP_HEIGHT - roomHeight);

    var candidate = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
    };

    var intersectsExisting = false;
    for (var i = 0; i < this.rooms.length; i++) {
      if (rectanglesIntersect(candidate, this.rooms[i], 1)) {
        intersectsExisting = true;
        break;
      }
    }

    if (intersectsExisting) continue;

    // Проходит проверку — вырезаем комнату и запоминаем
    for (var rowId = roomY; rowId < roomY + roomHeight; rowId++) {
      for (var cellId = roomX; cellId < roomX + roomWidth; cellId++) {
        this.map[rowId][cellId] = fieldTypes.empty;
      }
    }
    this.rooms.push(candidate);
  }
}

/**
 * Генерирует туннели на карте
 * Создает вертикальные или горизонтальные проходы между комнатами
 *
 * @param {string} direction - Направление туннелей ('x' для горизонтальных, 'y' для вертикальных)
 */
/**
 * Генерирует тоннели (сплошные линии от края до края) по заданному направлению.
 * Пока на карте более одной связной зоны пустых клеток, прокладываются только
 * линии, пересекающие минимум две разные компоненты (соединяя зоны). После
 * достижения единой связности — добивает количество тоннелей до квоты,
 * избегая линий, которые уже полностью пустые.
 *
 * @param {'x'|'y'} direction - направление тоннелей: 'x' — горизонтальные, 'y' — вертикальные
 * @returns {void}
 */
function genTunnels(direction) {
  var tunnelsCount = genRandFromTo(MIN_TUNNELS, MAX_TUNNELS);
  var totalLines = direction === 'y' ? MAP_WIDTH : MAP_HEIGHT;

  function isPassable(type) {
    return type !== fieldTypes.wall;
  }

  /**
   * Помечает каждую проходимую клетку карты номером её связной компоненты,
   * где связность считается по 4‑соседям.
   * Непроходимые клетки (стены) получают метку −1.
   *
   * @param {number[][]} map - карта
   * @returns {number[][]} labels - матрица меток компонент
   */
  function labelComponents(map) {
    //Создаём матрицу labels такого же размера, заполняя её значением −1
    var labels = new Array(MAP_HEIGHT);
    for (var y = 0; y < MAP_HEIGHT; y++) {
      labels[y] = new Array(MAP_WIDTH);
      for (var x = 0; x < MAP_WIDTH; x++) labels[y][x] = -1;
    }
    var current = 0;

    var queue = [];
    //Считаем количество несвязных компонент
    for (var y2 = 0; y2 < MAP_HEIGHT; y2++) {
      for (var x2 = 0; x2 < MAP_WIDTH; x2++) {
        if (labels[y2][x2] !== -1) continue;
        if (!isPassable(map[y2][x2])) continue;

        // BFS - для неразмеченных ячеек - добавляем в очередь обработки и в матрицу ее,
        // затем ее неразмеченных соседей, пока они есть.
        // По завершении обхода зоны - увеличиваем количество зон
        labels[y2][x2] = current;
        queue.length = 0;
        queue.push({ x: x2, y: y2 });
        while (queue.length) {
          var node = queue.shift();
          var nx, ny;

          nx = node.x + 1;
          ny = node.y;
          if (
            nx < MAP_WIDTH &&
            labels[ny][nx] === -1 &&
            isPassable(map[ny][nx])
          ) {
            labels[ny][nx] = current;
            queue.push({ x: nx, y: ny });
          }
          nx = node.x - 1;
          ny = node.y;
          if (nx >= 0 && labels[ny][nx] === -1 && isPassable(map[ny][nx])) {
            labels[ny][nx] = current;
            queue.push({ x: nx, y: ny });
          }
          nx = node.x;
          ny = node.y + 1;
          if (
            ny < MAP_HEIGHT &&
            labels[ny][nx] === -1 &&
            isPassable(map[ny][nx])
          ) {
            labels[ny][nx] = current;
            queue.push({ x: nx, y: ny });
          }
          nx = node.x;
          ny = node.y - 1;
          if (ny >= 0 && labels[ny][nx] === -1 && isPassable(map[ny][nx])) {
            labels[ny][nx] = current;
            queue.push({ x: nx, y: ny });
          }
        }
        current++;
      }
    }
    return labels;
  }

  /**
   * Возвращает уникальные метки компонент, которых касается линия тоннеля.
   *
   * @param {number} position - индекс линии (столбец для 'y', строка для 'x')
   * @param {'x'|'y'} direction - направление линии
   * @param {number[][]} labels - матрица меток компонент
   * @returns {number[]} список уникальных идентификаторов компонент
   */
  function getLineComponentSet(position, direction, labels) {
    var set = {};
    if (direction === 'y') {
      for (var y = 0; y < MAP_HEIGHT; y++) {
        var lbl = labels[y][position];
        if (lbl !== -1) set[lbl] = true;
      }
    } else {
      for (var x = 0; x < MAP_WIDTH; x++) {
        var lbl2 = labels[position][x];
        if (lbl2 !== -1) set[lbl2] = true;
      }
    }
    var result = [];
    for (var k in set) result.push(parseInt(k));
    return result;
  }

  //Создаем туннель, параллельно проверяя, не было ли его уже на этом месте
  /**
   * Создает тоннель от края до края по указанной линии.
   * Возвращает true, если не тоннеля не было на этом месте
   *
   * @param {Array<Array<number|string>>} map - карта для модификации
   * @param {'x'|'y'} direction - направление линии
   * @param {number} position - индекс линии
   * @returns {boolean}
   */
  function makeTunnel(map, direction, position) {
    var wasNotTunnel = false;
    if (direction === 'y') {
      for (var rowId = 0; rowId < MAP_HEIGHT; rowId++) {
        if (map[rowId][position] !== fieldTypes.empty) wasNotTunnel = true;
        map[rowId][position] = fieldTypes.empty;
      }
    } else {
      for (var colId = 0; colId < MAP_WIDTH; colId++) {
        if (map[position][colId] !== fieldTypes.empty) wasNotTunnel = true;
        map[position][colId] = fieldTypes.empty;
      }
    }
    return wasNotTunnel;
  }

  // Пытаемся провести тоннели, которые реально связывают разные компоненты
  var built = 0;
  var labels = labelComponents(this.map);
  var position = 0;

  while (built < MAX_TUNNELS && position < totalLines) {
    var compsOnLine = getLineComponentSet(position, direction, labels);

    if (compsOnLine.length === 0) {
      // Линия не соприкасается ни с одной пустой зоной — не подходит
      position++;
      continue;
    }
    // Требуем как минимум две разные компоненты для связи
    if (compsOnLine.length < 2 && built < MAX_TUNNELS - 1) {
      position++;
      continue;
    }

    makeTunnel(this.map, direction, position);

    // Обновляем связность после успешного создания тоннеля
    labels = labelComponents(this.map);
    built++;
    position++;
  }

  var builtRandom = 0;

  //Досоздаем недостающие тоннели в случайных местах
  if (tunnelsCount > built)
    for (var i = 0; i < tunnelsCount - built; i++) {
      var position = genRandFromTo(0, totalLines);
      const affected = makeTunnel(this.map, direction, position);
      if (!affected) {
        i--;
        continue;
      }
      builtRandom++;
    }

  console.log(
    'Создано тоннелей (связующих, случайных, нужно было):',
    built,
    builtRandom,
    tunnelsCount
  );
}

/**
 * Находит случайное пустое поле и размещает на нем объект
 *
 * @param {number|string} objectType - Тип объекта для размещения
 * @param {boolean} fieldLater - Если true, не размещает объект сразу, только возвращает координаты
 * @returns {Object} Координаты {x, y} где размещен объект
 */
function fillFieldByRandAndReturnPlace(objectType, fieldLater) {
  do {
    var coordinates = genRandomField();
    if (this.map[coordinates.y][coordinates.x] === fieldTypes.empty) {
      if (!fieldLater) {
        this.map[coordinates.y][coordinates.x] = objectType;
      }
      return coordinates;
    }
  } while (true);
}

/**
 * Размещает несколько объектов одного типа на карте
 *
 * @param {number} objectsCount - Количество объектов для размещения
 * @param {number|string} objectType - Тип объектов
 */
function fillFieldsByObject(objectsCount, objectType) {
  for (var objectId = 0; objectId < objectsCount; objectId++) {
    this.fillFieldByRandAndReturnPlace(objectType);
  }
}

/**
 * Размещает врагов на карте
 *
 * @param {number} count - Количество врагов для размещения
 */
function placeEnemies(count) {
  this.enemies = new Array(count);

  for (var enemyId = 0; enemyId < count; enemyId++) {
    var coordinates = this.fillFieldByRandAndReturnPlace('enemy_' + enemyId);

    this.enemies[enemyId] = {
      id: enemyId,
      health: MAX_HEALTH,
      x: coordinates.x,
      y: coordinates.y,
    };
  }
}

/**
 * Проверяет, может ли герой ступить на указанную ячейку
 *
 * @param {number} x - X координата ячейки
 * @param {number} y - Y координата ячейки
 * @returns {boolean} true если можно ступить, false если нельзя
 */
function canStep(x, y) {
  if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH) return false;
  if (!this.map[y]) return false;

  var fieldType = this.map[y][x];

  return (
    fieldType === fieldTypes.empty ||
    fieldType === fieldTypes.potion ||
    fieldType === fieldTypes.sword
  );
}

/**
 * Находит следующую позицию для врага и определяет возможность атаки
 * Реализует простой ИИ для движения врага к герою
 *
 * @param {Object} enemyPos - Текущая позиция врага {x, y}
 * @param {Object} targetPos - Позиция цели (героя) {x, y}
 * @returns {Object} Объект с новой позицией и флагом атаки {x, y, canAction}
 */
function findNextPositionAndAction(enemyPos, targetPos) {
  var result = {
    x: enemyPos.x,
    y: enemyPos.y,
    canAction: false,
  };

  var preDiffX = Math.abs(result.x - targetPos.x);
  var preDiffY = Math.abs(result.y - targetPos.y);

  var xTo = enemyPos.x < targetPos.x ? 1 : -1;
  var yTo = enemyPos.y < targetPos.y ? 1 : -1;

  if (preDiffX + preDiffY > 1) {
    if (this.canStep(result.x, result.y + yTo)) {
      if (this.canStep(result.x + xTo, result.y) && preDiffX > preDiffY) {
        result.x += xTo;
      } else {
        result.y += yTo;
      }
    } else if (this.canStep(result.x + xTo, result.y)) {
      result.x += xTo;
    } else if (this.canStep(result.x, result.y - yTo)) {
      result.y -= yTo;
    } else if (this.canStep(result.x - xTo, result.y)) {
      result.x -= xTo;
    }
  }

  var diffX = Math.abs(result.x - targetPos.x);
  var diffY = Math.abs(result.y - targetPos.y);

  if (diffX + diffY <= 1) {
    result.canAction = true;
  }

  return result;
}

/**
 * Обрабатывает действие врага - движение и атаку
 *
 * @param {Object} enemy - Объект врага с координатами и здоровьем
 */
function actEnemy(enemy) {
  var nextAction = this.findNextPositionAndAction(enemy, this.hero.position);
  var newX = nextAction.x;
  var newY = nextAction.y;
  var canAction = nextAction.canAction;

  if (canAction) {
    this.hero.health -= ENEMY_DAMAGE;
    console.log('Здоровье героя после атаки:', this.hero.health);
    if (this.hero.position) {
      markCellDirty(this.hero.position.x, this.hero.position.y);
    }
  }

  var enemyField = this.map[enemy.y][enemy.x];
  this.map[enemy.y][enemy.x] = this.map[newY][newX];
  this.map[newY][newX] = enemyField;

  markCellDirty(enemy.x, enemy.y);
  markCellDirty(newX, newY);

  enemy.x = newX;
  enemy.y = newY;
}

/**
 * Перемещает героя на новую позицию с обработкой взаимодействий
 *
 * @param {Object} position - Новая позиция {x, y}
 * @returns {boolean} true если перемещение успешно, false если невозможно
 */
function moveHeroWithFeedback(position) {
  console.log('Пробуем двигать героя', position);

  if (!this.canStep(position.x, position.y)) {
    console.log('Герой не может встать на эту ячейку:', position);
    return false;
  }

  if (this.hero.position) {
    this.map[this.hero.position.y][this.hero.position.x] = fieldTypes.empty;
    markCellDirty(this.hero.position.x, this.hero.position.y);
  }

  // Обрабатываем взаимодействия с объектами
  if (this.map[position.y][position.x] === fieldTypes.sword) {
    this.hero.hasSword = true;
    console.log('Герой взял меч');
    markCellDirty(position.x, position.y);
  }
  if (this.map[position.y][position.x] === fieldTypes.potion) {
    this.hero.health = MAX_HEALTH;
    console.log('Здоровье восстановлено:', this.hero.health);
    markCellDirty(position.x, position.y);
  }

  this.map[position.y][position.x] = fieldTypes.hero;
  this.hero.position = position;
  markCellDirty(position.x, position.y);

  return true;
}

/**
 * Атакует врагов в соседних ячейках
 * Проверяет 4 направления вокруг героя и наносит урон найденным врагам
 */
function beatEnemies() {
  var hPos = this.hero.position;
  var beatableFields = [
    this.map[hPos.y][hPos.x + 1],
    this.map[hPos.y][hPos.x - 1],
    this.map[hPos.y + 1][hPos.x],
    this.map[hPos.y - 1][hPos.x],
  ];

  for (var i = 0; i < beatableFields.length; i++) {
    var field = beatableFields[i];
    if (field && field.startsWith && field.startsWith('enemy')) {
      var enemyId = parseInt(field.split('_')[1]);
      var enemy = this.enemies.find(function (el) {
        return el.id === enemyId;
      });

      if (enemy) {
        enemy.health -= this.hero.hasSword ? SWORD_DAMAGE : FIST_DAMAGE;
        console.log('Здоровье врага', enemyId, ':', enemy.health);

        markCellDirty(enemy.x, enemy.y);

        if (enemy.health <= 0) {
          this.enemies = this.enemies.filter(function (current) {
            return !(current.x === enemy.x && current.y === enemy.y);
          });
          this.map[enemy.y][enemy.x] = fieldTypes.empty;
          markCellDirty(enemy.x, enemy.y);
        }
        this.hero.hasSword = false;
      }
    }
  }
}

var heroInitial = {
  health: MAX_HEALTH,
  hasSword: false,
  position: null,
};

/**
 * Конструктор объекта карты игры
 * Инициализирует карту, героя и привязывает методы
 */
function Game() {
  this.hero = JSON.parse(JSON.stringify(heroInitial));

  this.genRooms = genRooms;
  this.genTunnels = genTunnels;
  this.fillFieldByRandAndReturnPlace = fillFieldByRandAndReturnPlace.bind(this);
  this.fillFieldsByObject = fillFieldsByObject.bind(this);
  this.moveHeroWithFeedback = moveHeroWithFeedback.bind(this);
  this.canStep = canStep.bind(this);
  this.findNextPositionAndAction = findNextPositionAndAction.bind(this);
  this.placeEnemies = placeEnemies.bind(this);
  this.actEnemy = actEnemy.bind(this);
  this.beatEnemies = beatEnemies.bind(this);

  const gameThis = this;

  this.genMap = function () {
    gameThis.map = new Array(MAP_HEIGHT);

    for (var rowId = 0; rowId < MAP_HEIGHT; rowId++) {
      gameThis.map[rowId] = new Array(MAP_WIDTH);
      for (var cellId = 0; cellId < MAP_WIDTH; cellId++) {
        gameThis.map[rowId][cellId] = fieldTypes.wall;
      }
    }
  };
  this.init = function () {
    gameThis.genMap();
    gameThis.genRooms();
    gameThis.genTunnels('x');
    gameThis.genTunnels('y');

    gameThis.fillFieldsByObject(SWORD_COUNT, fieldTypes.sword);
    gameThis.fillFieldsByObject(POTION_COUNT, fieldTypes.potion);

    gameThis.moveHeroWithFeedback(
      gameThis.fillFieldByRandAndReturnPlace(fieldTypes.hero, true)
    );

    gameThis.placeEnemies(ENEMY_COUNT);

    render(true);
  };
  this.clear = function () {
    delete gameThis.rooms;
    delete gameThis.map;
    this.hero = JSON.parse(JSON.stringify(heroInitial));
    delete gameThis.enemies;
  };
}

function clearMap() {
  alert('Вы погибли! Игра окончена.');
  game.clear();
  game.init();
}

/**
 * Обрабатывает действия всех врагов на карте
 * Вызывает actEnemy для каждого врага
 */
var actEnemies = function () {
  for (var enemyId in game.enemies) {
    console.log('Обновление позиции врага:', game.enemies[enemyId]);
    game.actEnemy(game.enemies[enemyId]);
  }
};
