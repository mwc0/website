(function () {
  const boardEl = document.getElementById('wordleBoard');
  const keyboardEl = document.getElementById('wordleKeyboard');
  const messageEl = document.getElementById('wordleMessage');
  const streakEl = document.getElementById('wordleStreak');
  const bestEl = document.getElementById('wordleBest');
  const overlay = document.getElementById('wordleOverlay');
  const overlayTitle = document.getElementById('wordleOverlayTitle');
  const overlaySub = document.getElementById('wordleOverlaySub');

  if (!boardEl) return;

  const ROWS = 6;
  const COLS = 5;

  // ---- word list (also doubles as the valid-guess dictionary) ----
  const WORDS = [
    'ABOUT', 'ABOVE', 'ADAPT', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN', 'AGENT', 'AGREE',
    'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
    'ALONG', 'ALOUD', 'ALTER', 'AMONG', 'AMPLE', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'ANKLE',
    'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'AROMA', 'ARRAY', 'ARROW',
    'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWAIT', 'AWAKE', 'AWARD', 'AWARE', 'BADGE',
    'BAKER', 'BASIC', 'BASIN', 'BASIS', 'BATCH', 'BEACH', 'BEGIN', 'BEING', 'BELOW', 'BENCH',
    'BERRY', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLEND', 'BLESS', 'BLIND',
    'BLOCK', 'BLOOD', 'BLOOM', 'BOARD', 'BOAST', 'BONUS', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN',
    'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING',
    'BROAD', 'BROKE', 'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'CABLE', 'CANDY',
    'CARGO', 'CARRY', 'CARVE', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHALK', 'CHAOS', 'CHARM',
    'CHART', 'CHASE', 'CHEAP', 'CHEAT', 'CHECK', 'CHEEK', 'CHEER', 'CHESS', 'CHEST', 'CHIEF',
    'CHILD', 'CHOSE', 'CIVIC', 'CIVIL', 'CLAIM', 'CLASH', 'CLASP', 'CLASS', 'CLEAN', 'CLEAR',
    'CLERK', 'CLICK', 'CLIFF', 'CLIMB', 'CLING', 'CLOCK', 'CLONE', 'CLOSE', 'CLOTH', 'CLOUD',
    'CLOWN', 'COACH', 'COAST', 'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAZY', 'CREAM',
    'CREEK', 'CREPT', 'CREST', 'CRIME', 'CRISP', 'CROSS', 'CROWD', 'CROWN', 'CRUEL', 'CRUSH',
    'CURVE', 'DAILY', 'DAIRY', 'DANCE', 'DEALT', 'DEATH', 'DEBUT', 'DECAY', 'DECOR', 'DELAY',
    'DELTA', 'DENSE', 'DEPTH', 'DEVIL', 'DIARY', 'DIRTY', 'DISCO', 'DODGE', 'DONOR', 'DOUBT',
    'DOUGH', 'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRIED',
    'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DRUNK', 'DWELT', 'EAGER', 'EARLY', 'EARTH',
    'EASEL', 'EIGHT', 'ELDER', 'ELECT', 'EMBER', 'EMPTY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL',
    'ERROR', 'ESSAY', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FABLE', 'FAINT', 'FAIRY',
    'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT', 'FAVOR', 'FEAST', 'FENCE', 'FERRY', 'FIBER',
    'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLAME', 'FLASH', 'FLEET',
    'FLESH', 'FLIER', 'FLING', 'FLOAT', 'FLOCK', 'FLOOD', 'FLOOR', 'FLOUR', 'FLUID', 'FLUSH',
    'FOCUS', 'FORCE', 'FORGE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD',
    'FRESH', 'FRONT', 'FROST', 'FROWN', 'FROZE', 'FRUIT', 'FUNNY', 'GHOST', 'GIANT', 'GLAND',
    'GLASS', 'GLOBE', 'GLORY', 'GLOVE', 'GRACE', 'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE',
    'GRAPH', 'GRASP', 'GRASS', 'GRAVE', 'GREAT', 'GREED', 'GREEN', 'GREET', 'GRIEF', 'GRILL',
    'GRIND', 'GROSS', 'GROUP', 'GROVE', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILT',
    'HABIT', 'HAPPY', 'HARSH', 'HASTE', 'HAVEN', 'HEARD', 'HEART', 'HEAVY', 'HELLO', 'HENCE',
    'HONEY', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY', 'IDEAL', 'IMAGE',
    'IMPLY', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'IVORY', 'JOINT', 'JOKER', 'JOLLY', 'JUDGE',
    'JUICE', 'JUMBO', 'KNACK', 'KNEEL', 'KNIFE', 'KNOCK', 'KNOWN', 'LABEL', 'LABOR', 'LARGE',
    'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON',
    'LEVEL', 'LIGHT', 'LIMIT', 'LINEN', 'LIVER', 'LOCAL', 'LODGE', 'LOGIC', 'LOOSE', 'LOWER',
    'LOYAL', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MATCH', 'MAYOR',
    'MEANT', 'MEDAL', 'MEDIA', 'MELON', 'MERCY', 'MERGE', 'MERIT', 'METAL', 'METER', 'MIGHT',
    'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MOIST', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT',
    'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAIVE', 'NASTY', 'NAVAL', 'NERVE', 'NEVER', 'NEWLY',
    'NIGHT', 'NOBLE', 'NOISE', 'NORTH', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN',
    'ORBIT', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'PANEL', 'PANIC', 'PAPER', 'PARTY',
    'PATCH', 'PAUSE', 'PEACE', 'PHASE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIXEL',
    'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'POINT', 'POWER', 'PRESS', 'PRICE',
    'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PULSE', 'PUPIL',
    'PURSE', 'QUEEN', 'QUERY', 'QUEST', 'QUICK', 'QUIET', 'QUITE', 'QUOTE', 'RADIO', 'RAISE',
    'RALLY', 'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT', 'READY', 'REALM', 'REBEL',
    'REFER', 'REIGN', 'RELAX', 'REPLY', 'RIDGE', 'RIGHT', 'RIVAL', 'RIVER', 'ROAST', 'ROBOT',
    'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SALAD', 'SALES', 'SAUCE', 'SCALE', 'SCARE',
    'SCARF', 'SCENE', 'SCOPE', 'SCORE', 'SCOUT', 'SENSE', 'SERVE', 'SEVEN', 'SHADE', 'SHAKE',
    'SHALL', 'SHAPE', 'SHARE', 'SHARK', 'SHARP', 'SHEEP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT',
    'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE', 'SHORT', 'SHOUT', 'SIGHT', 'SILLY', 'SINCE',
    'SIXTH', 'SIXTY', 'SKILL', 'SKIRT', 'SLEEP', 'SLICE', 'SLIDE', 'SLOPE', 'SMALL', 'SMART',
    'SMILE', 'SMOKE', 'SNACK', 'SOLAR', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE',
    'SPARE', 'SPARK', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPICE', 'SPINE', 'SPLIT', 'SPOIL',
    'SPOKE', 'SPORT', 'SQUAD', 'STACK', 'STAFF', 'STAGE', 'STAIR', 'STAKE', 'STALE', 'STAND',
    'STARE', 'START', 'STATE', 'STEAK', 'STEAL', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK',
    'STIFF', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STOVE', 'STUDY',
    'STUFF', 'STYLE', 'SUGAR', 'SUPER', 'SWEET', 'SWIFT', 'SWING', 'SWORD', 'TABLE', 'TASTE',
    'TEACH', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THIEF', 'THING',
    'THINK', 'THIRD', 'THOSE', 'THREW', 'THROW', 'TIGER', 'TIGHT', 'TIRED', 'TITLE', 'TODAY',
    'TOKEN', 'TOOTH', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACE', 'TRACK', 'TRADE', 'TRAIL',
    'TRAIN', 'TRAIT', 'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRUCK',
    'TRULY', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'ULTRA', 'UNCLE', 'UNDER', 'UNION',
    'UNITE', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VAGUE', 'VALID',
    'VALUE', 'VAPOR', 'VAULT', 'VENUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL',
    'VOICE', 'WAGON', 'WASTE', 'WATCH', 'WATER', 'WEIGH', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH',
    'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH',
    'WOULD', 'WOUND', 'WRIST', 'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOUTH'
  ];

  let target = '';
  let row = 0;
  let col = 0;
  let guess = '';
  let locked = false; // true once a round has ended, waiting for "next word"
  let streak = 0;
  let best = 0;
  let tiles = []; // tiles[row][col] element refs
  let keyEls = {}; // letter -> key element

  function loadBest() {
    try {
      return parseInt(localStorage.getItem('wordle-best-streak') || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem('wordle-best-streak', String(value));
    } catch (e) {
      // storage unavailable — ignore
    }
  }

  function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    tiles = [];
    for (let r = 0; r < ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'wordle__row';
      const rowTiles = [];
      for (let c = 0; c < COLS; c++) {
        const tile = document.createElement('div');
        tile.className = 'wordle__tile';
        rowEl.appendChild(tile);
        rowTiles.push(tile);
      }
      boardEl.appendChild(rowEl);
      tiles.push(rowTiles);
    }
  }

  const KEY_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
  ];

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    keyEls = {};
    KEY_ROWS.forEach((rowKeys) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'wordle__krow';
      rowKeys.forEach((key) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wordle__key';
        if (key === 'ENTER' || key === 'BACK') {
          btn.classList.add('wordle__key--wide');
        }
        btn.textContent = key === 'BACK' ? '⌫' : key === 'ENTER' ? 'enter' : key;
        btn.addEventListener('click', () => handleKey(key));
        rowEl.appendChild(btn);
        if (key !== 'ENTER' && key !== 'BACK') {
          keyEls[key] = btn;
        }
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function setMessage(text) {
    messageEl.textContent = text || '';
  }

  function shakeRow(r) {
    const rowEl = boardEl.children[r];
    rowEl.classList.remove('wordle__row--shake');
    // force reflow so the animation can restart
    void rowEl.offsetWidth;
    rowEl.classList.add('wordle__row--shake');
  }

  function updateTileText() {
    for (let c = 0; c < COLS; c++) {
      tiles[row][c].textContent = guess[c] || '';
      tiles[row][c].classList.toggle('wordle__tile--filled', Boolean(guess[c]));
    }
  }

  function evaluateGuess(g, t) {
    const result = new Array(COLS).fill('absent');
    const targetLetters = t.split('');
    const guessLetters = g.split('');
    const used = new Array(COLS).fill(false);

    for (let i = 0; i < COLS; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }
    for (let i = 0; i < COLS; i++) {
      if (result[i] === 'correct') continue;
      const idx = targetLetters.findIndex((ch, j) => ch === guessLetters[i] && !used[j]);
      if (idx !== -1) {
        result[i] = 'present';
        used[idx] = true;
      }
    }
    return result;
  }

  const KEY_PRIORITY = { absent: 0, present: 1, correct: 2 };

  function applyResult(result) {
    for (let c = 0; c < COLS; c++) {
      const tile = tiles[row][c];
      const letter = guess[c];
      const status = result[c];
      setTimeout(() => {
        tile.classList.add('wordle__tile--flip');
        setTimeout(() => {
          tile.classList.add(`wordle__tile--${status}`);
          tile.classList.remove('wordle__tile--flip');
        }, 150);
      }, c * 220);

      const key = keyEls[letter];
      if (key) {
        const current = key.dataset.status || 'default';
        if (KEY_PRIORITY[status] > (KEY_PRIORITY[current] ?? -1)) {
          key.dataset.status = status;
          key.classList.remove('wordle__key--correct', 'wordle__key--present', 'wordle__key--absent');
          key.classList.add(`wordle__key--${status}`);
        }
      }
    }
  }

  function endRound(won) {
    locked = true;
    if (won) {
      streak += 1;
      if (streak > best) {
        best = streak;
        saveBest(best);
      }
      overlayTitle.textContent = row === 1 ? 'genius!' : 'nice one!';
      overlaySub.textContent = `streak: ${streak} — press enter for the next word`;
    } else {
      streak = 0;
      overlayTitle.textContent = 'out of guesses';
      overlaySub.textContent = `the word was ${target} — press enter to try a new one`;
    }
    streakEl.textContent = String(streak);
    bestEl.textContent = String(best);
    const revealDelay = COLS * 220 + 400;
    setTimeout(() => {
      overlay.classList.remove('is-hidden');
    }, revealDelay);
  }

  function submitGuess() {
    if (locked) return;
    if (guess.length !== COLS) {
      shakeRow(row);
      setMessage('not enough letters');
      setTimeout(() => setMessage(''), 1200);
      return;
    }
    if (!WORDS.includes(guess)) {
      shakeRow(row);
      setMessage('not in word list');
      setTimeout(() => setMessage(''), 1200);
      return;
    }

    const result = evaluateGuess(guess, target);
    applyResult(result);

    const won = guess === target;
    const isLastRow = row === ROWS - 1;

    row += 1;
    col = 0;
    guess = '';

    if (won) {
      endRound(true);
    } else if (isLastRow) {
      endRound(false);
    }
  }

  function handleKey(key) {
    if (locked) {
      if (key === 'ENTER') startRound();
      return;
    }
    if (key === 'ENTER') {
      submitGuess();
      return;
    }
    if (key === 'BACK') {
      if (col > 0) {
        col -= 1;
        guess = guess.slice(0, -1);
        updateTileText();
      }
      return;
    }
    if (/^[A-Z]$/.test(key) && col < COLS) {
      guess += key;
      col += 1;
      updateTileText();
    }
  }

  function resetKeyboardColors() {
    Object.values(keyEls).forEach((btn) => {
      btn.classList.remove('wordle__key--correct', 'wordle__key--present', 'wordle__key--absent');
      delete btn.dataset.status;
    });
  }

  function startRound() {
    target = pickWord();
    row = 0;
    col = 0;
    guess = '';
    locked = false;
    setMessage('');
    buildBoard();
    resetKeyboardColors();
    overlay.classList.add('is-hidden');
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'Enter') {
      e.preventDefault();
      handleKey('ENTER');
      return;
    }
    if (k === 'Backspace') {
      e.preventDefault();
      handleKey('BACK');
      return;
    }
    if (/^[a-zA-Z]$/.test(k)) {
      e.preventDefault();
      handleKey(k.toUpperCase());
    }
  });

  overlay.addEventListener('click', () => {
    if (locked) startRound();
  });

  best = loadBest();
  bestEl.textContent = String(best);
  streakEl.textContent = '0';

  buildKeyboard();
  buildBoard();
  locked = true;
  overlayTitle.textContent = 'wordle unlimited';
  overlaySub.textContent = 'guess the 5-letter word — press enter to begin';
  overlay.classList.remove('is-hidden');
})();
