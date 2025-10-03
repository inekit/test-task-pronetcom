/**
 * Константы игры
 */

// Константы для типов полей
var fieldTypes = {
  empty: 0,
  wall: 1,
  sword: 2,
  potion: 3,
  enemy: 4,
  hero: 5,
};

// Константы для размеров
var CELL_SIZE = 20;
var MAP_WIDTH = 40;
var MAP_HEIGHT = 24;

// Константы для здоровья
var MAX_HEALTH = 100;

// Константы для урона
var SWORD_DAMAGE = 80;
var FIST_DAMAGE = 40;
var ENEMY_DAMAGE = 10;

// Константы для генерации карты
var MIN_ROOMS = 5;
var MAX_ROOMS = 10;
var MIN_TUNNELS = 3;
var MAX_TUNNELS = 5;
var SWORD_COUNT = 2;
var POTION_COUNT = 10;
var ENEMY_COUNT = 10;
var MIN_ROOM_SIZE = 3;
var MAX_ROOM_SIZE = 8;
