# Banter Connect 4

A fully synced, multiplayer Connect 4 game that can be effortlessly embedded into any [Banter](https://bantervr.com) space.

## Features

*   **Multiplayer Syncing**:  Game state is synchronized in real-time between all players in the space.
*   **Plug & Play**: Embed with a single line of HTML.
*   **Customizable**: Configure position, rotation, and scale via URL parameters.
*   **No External Assets**: The board and pieces are procedurally generated using Banter's geometry system.

## How to Embed

Add the following script tag to your space's `index.html` (or wherever you inject Banter scripts):

```html
<script src="https://banter-connect4.firer.at/Connect4.js?instance=game1&boardPosition=0 1.5 5"></script>
```

*Replace the `src` URL with the actual path to where you are hosting `Connect4.js`.*

## Configuration Parameters

You can configure the game instance using query parameters in the script `src`:

| Parameter | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `instance` | **Required** for multiple games. A unique identifier for this game instance to sync correctly. | `[url_path]` | `?instance=lobby_game` |
| `boardPosition` | The position of the board in the space (x y z). | `0 1.1 0` | `?boardPosition=5 0 10` |
| `boardRotation` | The rotation of the board in Euler degrees (x y z). | `0 0 0` | `?boardRotation=0 180 0` |
| `boardScale` | The scale of the board (x y z). | `1 1 1` | `?boardScale=2 2 2` |
| `resetPosition` | Position of the reset button relative to the board. | `0 -0.4 0` | `?resetPosition=0 -0.5 0` |
| `resetRotation` | Rotation of the reset button relative to the board. | `0 0 0` | `?resetRotation=180 0 0` |
| `resetScale` | Scale of the reset button. | `1 1 1` | `?resetScale=0.5 0.5 0.5` |
| `hideUI` | If `true`, hides the restart/reset button. | `false` | `?hideUI=true` |
| `HideBoard` | If `true`, hides the game board frame. | `false` | `?HideBoard=true` |

### Example with all parameters

```html
<script src="https://banter-connect4.firer.at/Connect4.js?instance=lounge_c4&boardPosition=10 0.5 -3&boardRotation=0 90 0&boardScale=1.5 1.5 1.5"></script>
```

## Game Rules

1.  **Objective**: Connect 4 pieces of your color (Red or Yellow) vertically, horizontally, or diagonally.
2.  **Gameplay**:
    *   Click on any column to drop your piece into the lowest available slot.
    *   Turn passes to the other player automatically.
    *   The game prevents moves if the column is full or the game is over.
3.  **Reset**: Click the reset button (if visible) to clear the board and start a new game. This syncs for everyone.

## Development

The game logic is contained within `Connect4.js`.
*   **Logic**: A `Connect4Game` class handles the board state and win conditions.
*   **Rendering**: Uses `BS.GameObject` and `BS.BanterGeometry` to draw the blue rack and pieces.
*   **Syncing**: Uses `BS.spaceState` to share the board configuration.
