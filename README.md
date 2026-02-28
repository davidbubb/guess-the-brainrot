# Brainrot Daily 🧠

A **mobile-first, daily web game** inspired by Wordle where you guess the [Italian Brainrot](https://knowyourmeme.com/memes/italian-brainrot) character of the day from a series of progressive clues.

## How to Play

1. **Read Clue 1** — it's deliberately vague.
2. **Type your guess** in the input field. Autocomplete suggestions will appear as you type.
3. **Correct?** → You earn points. The earlier you guess, the more points you score!
4. **Wrong?** → The next clue is revealed, but your potential score drops.
5. You have **5 clues** total. If you don't guess correctly by then, the answer is revealed.
6. A new character appears every day at midnight. Keep your streak alive! 🔥

## Scoring

| Guessed on clue | Points |
|:-:|:-:|
| 1 | **1 000** |
| 2 | 800 |
| 3 | 600 |
| 4 | 400 |
| 5 | 200 |
| Did not guess | 0 |

## Running Locally

This is a **static site** — no build step required.

```bash
# Any static file server works, e.g.:
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or the port shown) in your browser.

## Characters

The game currently includes 15 Italian Brainrot characters:

- Tralalero Tralala
- Bombardiro Crocodilo
- Trippi Troppi
- Ballerina Cappuccina
- Lirilì Larilà
- Chimpanzini Bananini
- Frigo Camelo
- La Vaca Saturno Saturno
- Tung Tung Tung Sahur
- Glorbo Fruttodrillo
- Brrr Brrr Patapim
- Capucino Assassino
- Crocodillo il Camelo
- Boneca Ambalabu
- Bananito Crocodilo

## Project Structure

```
├── index.html      # Game shell & markup
├── style.css       # Mobile-first dark-theme styles
├── js/
│   ├── data.js     # Character database with 5 clues each
│   └── game.js     # Game logic, state, localStorage, share
└── README.md
```

## Tech Stack

Plain **HTML + CSS + JavaScript** — no frameworks, no build tools, no dependencies. Works offline after the first load.
