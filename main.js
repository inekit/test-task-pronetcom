/**
 * Главный файл игры - точка входа
 */

/**
 * Обработчик нажатий клавиш
 * Обрабатывает движение героя и атаки
 */
document.addEventListener('keyup', function (e) {
  if (e.code.startsWith('Arrow')) {
    var targetCell = {
      x: e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0,
      y: e.code === 'ArrowUp' ? -1 : e.code === 'ArrowDown' ? 1 : 0,
    };

    var heroMoved = game.moveHeroWithFeedback({
      x: game.hero.position.x + targetCell.x,
      y: game.hero.position.y + targetCell.y,
    });

    if (heroMoved) {
      actEnemies();
    }
  } else if (e.code === 'Space') {
    actEnemies();
    game.beatEnemies();
  } else return;

  render();
  if (game.hero.health <= 0) {
    clearMap();
  }
});
