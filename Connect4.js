(function () {
    /**
     * Banter Connect 4 Embed Script
     * A fully synced multiplayer Connect 4 game for Banter.
     */

    // --- Configuration ---
    const config = {
        boardPosition: new BS.Vector3(0, 1.1, 0),
        boardRotation: new BS.Vector3(0, 0, 0),
        boardScale: new BS.Vector3(1, 1, 1),
        resetPosition: new BS.Vector3(0, -0.4, 0), // Default below board
        resetRotation: new BS.Vector3(0, 0, 0),
        resetScale: new BS.Vector3(1, 1, 1),
        instance: window.location.href.split('?')[0],
        hideUI: false
    };

    const COLORS = {
        board: '#0055AA',    // Classic Blue Board
        red: '#D50000',      // Red Piece
        yellow: '#FFEA00',   // Yellow Piece
        empty: '#FFFFFF',    // Empty slot (transparent-ish visual)
        winHighlight: '#00FF00', // Green highlight for winning pieces
        hover: '#4488FF'     // Column hover effect
    };

    // Helper to parse Vector3
    const parseVector3 = (str, defaultVal) => {
        if (!str) return defaultVal;
        const s = str.trim();
        if (s.includes(' ')) {
            const parts = s.split(' ').map(Number);
            if (parts.length >= 3) return new BS.Vector3(parts[0], parts[1], parts[2]);
        }
        const num = parseFloat(s);
        if (!isNaN(num)) {
            return new BS.Vector3(num, num, num);
        }
        return defaultVal;
    };

    // Parse URL params
    const currentScript = document.currentScript;
    if (currentScript) {
        const url = new URL(currentScript.src);
        const params = new URLSearchParams(url.search);

        if (params.has('hideUI')) config.hideUI = params.get('hideUI') === 'true';
        if (params.has('instance')) config.instance = params.get('instance');

        config.boardScale = parseVector3(params.get('boardScale'), config.boardScale);
        config.boardPosition = parseVector3(params.get('boardPosition'), config.boardPosition);
        config.boardRotation = parseVector3(params.get('boardRotation'), config.boardRotation);

        config.resetScale = parseVector3(params.get('resetScale'), config.resetScale);
        config.resetPosition = parseVector3(params.get('resetPosition'), config.resetPosition);
        config.resetRotation = parseVector3(params.get('resetRotation'), config.resetRotation);
    }

    // --- Game Logic ---
    class Connect4Game {
        constructor() {
            this.rows = 6;
            this.cols = 7;
            this.board = this.createEmptyBoard();
            this.currentPlayer = 1; // 1 = Red, 2 = Yellow
            this.winner = null;
            this.winningCells = [];
            this.gameOver = false;
        }

        createEmptyBoard() {
            return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        }

        reset() {
            this.board = this.createEmptyBoard();
            this.currentPlayer = 1;
            this.winner = null;
            this.winningCells = [];
            this.gameOver = false;
        }

        loadState(state) {
            this.board = state.board;
            this.currentPlayer = state.currentPlayer;
            this.winner = state.winner;
            // Re-calculate winning cells if won, or just trust state (we store winningCells locally mainly for display)
            if (this.winner) {
                this.checkWin();
            } else {
                this.winningCells = [];
                this.gameOver = false;
            }
        }

        getState() {
            return {
                board: this.board,
                currentPlayer: this.currentPlayer,
                winner: this.winner,
                lastModified: this.lastModified
            };
        }

        // Returns new state if move is valid, null otherwise. Does not mutate instance.
        simulateDrop(col) {
            if (this.gameOver) return null;
            if (col < 0 || col >= this.cols) return null;

            // Clone board
            const boardCopy = this.board.map(row => [...row]);
            let placedRow = -1;

            // Find lowest empty row (Row 0 is bottom!)
            for (let row = 0; row < this.rows; row++) {
                if (boardCopy[row][col] === 0) {
                    boardCopy[row][col] = this.currentPlayer;
                    placedRow = row;
                    console.log(`Connect4: SimulateDrop Col ${col} -> Placed at Row ${row} (Index 0 is Bottom)`);
                    break;
                }
            }

            if (placedRow === -1) return null; // Column full

            // Calculate hypothetical next state basics
            let nextPlayer = (this.currentPlayer === 1 ? 2 : 1);
            let nextWinner = this.winner;
            let nextGameOver = this.gameOver;

            // Check Win (Need a static or localized checkWin that works on boardCopy)
            // Reuse existing checkWin logic but pass board?
            // Existing checkWin uses `this.board`.
            // Let's copy checkWin logic briefly here or refactor. 
            // Refactoring checkWin to take a board argument is cleaner.

            // QUICK IMPLEMENTATION: temporary object to check win
            const tempGame = new Connect4Game();
            tempGame.board = boardCopy;
            tempGame.rows = this.rows;
            tempGame.cols = this.cols;
            tempGame.currentPlayer = this.currentPlayer; // Who just moved

            if (tempGame.checkWin()) {
                nextWinner = this.currentPlayer;
                nextGameOver = true;
                // We don't change nextPlayer if game over? 
                // Logic in dropPiece: if win, winner set, gameOver=true.
                // else if not win, toggle player.
                // So if win, nextPlayer is arguably irrelevant or stays same.
            } else if (tempGame.checkDraw()) {
                nextWinner = 'draw';
                nextGameOver = true;
            }

            return {
                board: boardCopy,
                currentPlayer: nextGameOver ? this.currentPlayer : nextPlayer,
                winner: nextWinner,
                lastModified: Date.now()
            };
        }

        dropPiece(col) {
            if (this.gameOver) return false;
            if (col < 0 || col >= this.cols) return false;

            // Find lowest empty row (Visual Row 0 is bottom, so start there)
            for (let row = 0; row < this.rows; row++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = this.currentPlayer;
                    console.log(`Connect4: DropPiece Col ${col} -> Placed at Row ${row} (Index 0 is Bottom)`);

                    if (this.checkWin()) {
                        this.winner = this.currentPlayer;
                        this.gameOver = true;
                    } else if (this.checkDraw()) {
                        this.winner = 'draw';
                        this.gameOver = true;
                    } else {
                        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                    }
                    return true;
                }
            }
            return false; // Column full
        }

        checkDraw() {
            return this.board.every(row => row.every(cell => cell !== 0));
        }

        checkWin() {
            const directions = [
                [0, 1],  // Horizontal
                [1, 0],  // Vertical
                [1, 1],  // Diagonal /
                [1, -1]  // Diagonal \
            ];

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const player = this.board[r][c];
                    if (player === 0) continue;

                    for (const [dr, dc] of directions) {
                        let cells = [[r, c]];
                        for (let i = 1; i < 4; i++) {
                            const nr = r + dr * i;
                            const nc = c + dc * i;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === player) {
                                cells.push([nr, nc]);
                            } else {
                                break;
                            }
                        }
                        if (cells.length === 4) {
                            this.winningCells = cells;
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }

    // --- Banter Visuals ---
    const state = {
        root: null,
        piecesRoot: null,
        slots: [], // 2D array of GameObjects
        columns: [], // Column hover colliders
        isSyncing: false,
        game: new Connect4Game()
    };

    function hexToVector4(hex) {
        let c = hex.substring(1);
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return new BS.Vector4(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255, 1);
    }

    async function init() {
        if (!window.BS) {
            console.error("Banter SDK not found!");
            return;
        }

        BS.BanterScene.GetInstance().On("unity-loaded", setupScene);
    }

    async function setupScene() {
        console.log("Connect4: Setup Scene Started");
        state.root = await new BS.GameObject("Connect4_Root").Async();
        let t = await state.root.AddComponent(new BS.Transform());
        t.position = config.boardPosition;
        t.localEulerAngles = config.boardRotation;
        t.localScale = config.boardScale;

        // --- Construct Double-Sided Grid Frame ---
        // Instead of a solid backing, we build a rack from bars so pieces are visible from both sides.
        const rows = 6;
        const cols = 7;
        const startX = -0.3;
        const startY = 0.1;
        const gapX = 0.1;
        const gapY = 0.1;

        // Rack Color can be same Blue
        // Frame Dimensions
        // We need 8 Vertical Bars (between cols)
        // We need 7 Horizontal bars (between rows+top/bottom)

        // Z-Positioning: 
        // Pieces at 0.
        // Frame at 0.
        // Frame Depth > Piece Depth.
        // Piece Depth (cylinder height) = 0.02.
        // Frame Depth = 0.03.

        const frameDepth = 0.03;
        const barWidth = 0.02; // Thickness of the bars

        // 1. Vertical Bars (8 total: Left of col 0, Right of col 0/Left of col 1... Right of col 6)
        // Columns are at startX + c*gapX.
        // Bars should be at (startX - gapX/2) + k*gapX ??
        // Col 0 center: -0.3. Width 0.1. Left Edge: -0.35. Right Edge: -0.25.
        // Let's place bars at x = -0.35, -0.25, -0.15 ...

        const frameRoot = await new BS.GameObject("Frame_Root").Async();
        await frameRoot.SetParent(state.root, false);
        await frameRoot.AddComponent(new BS.Transform());

        const gridHeight = (rows * gapY) + barWidth; // approximate

        for (let i = 0; i <= cols; i++) {
            const barX = (startX - (gapX / 2)) + (i * gapX);
            // Center Y: Rows range from 0.1 to 0.6. Center ~0.35.
            const centerY = startY + ((rows - 1) * gapY) / 2;

            const vBar = await createBanterObject(frameRoot, BS.GeometryType.BoxGeometry,
                { width: barWidth, height: gridHeight, depth: frameDepth },
                COLORS.board,
                new BS.Vector3(barX, centerY, 0)
            );
        }

        // 2. Horizontal Bars (top and bottom minimum, maybe between rows if we want full grid look)
        // Full grid looks better and is not expensive (7 bars).
        // Rows at y = 0.1, 0.2 ...
        // Bars at y = 0.05, 0.15 ...
        const gridWidth = (cols * gapX) + barWidth;
        const centerX = startX + ((cols - 1) * gapX) / 2;

        for (let i = 0; i <= rows; i++) {
            const barY = (startY - (gapY / 2)) + (i * gapY);

            const hBar = await createBanterObject(frameRoot, BS.GeometryType.BoxGeometry,
                { width: gridWidth, height: barWidth, depth: frameDepth },
                COLORS.board,
                new BS.Vector3(centerX, barY, 0)
            );
        }

        // Create Slots Matrix
        state.piecesRoot = await new BS.GameObject("Pieces_Root").Async();
        await state.piecesRoot.SetParent(state.root, false);
        await state.piecesRoot.AddComponent(new BS.Transform());

        // Pieces at Z=0 (Center of attention)
        // They are cylinders radius 0.04, height 0.02.
        const piecesZ = 0;

        for (let r = 0; r < 6; r++) {
            state.slots[r] = [];
            for (let c = 0; c < 7; c++) {
                const x = startX + (c * gapX);
                const y = startY + (r * gapY); // Visual: Row 0 is Bottom

                if (c === 0) console.log(`Connect4: Visual Setup Row ${r} -> Y=${y.toFixed(3)}`);

                const piece = await createBanterObject(state.piecesRoot, BS.GeometryType.SphereGeometry,
                    { radius: 0.045 },
                    COLORS.empty,
                    new BS.Vector3(x, y, piecesZ)
                );

                const pt = piece.GetComponent(BS.ComponentType.Transform);
                pt.localScale = new BS.Vector3(1, 1, 0.25); 
                piece.SetActive(false);

                state.slots[r][c] = piece;
            }
        }

        // Create Clickable Columns
        // Center at Z=0.
        // Keeping Depth = 0.05 (5cm) as 0.2 was deemed potentially too thick/obstructive
        const columnZ = 0;
        const columnDepth = 0.05;

        for (let c = 0; c < 7; c++) {
            const x = startX + (c * gapX);
            const pos = new BS.Vector3(x, startY + ((rows - 1) * gapY) / 2, columnZ);

            // Reduce width to 0.07 (gap 0.1 - bar 0.02 = 0.08 space). 
            // 0.07 leaves 0.005 margin.
            const colWidth = gapX * 0.7; // 0.07

            // Revert to invisible columns
            const colObj = await new BS.GameObject(`Column_${c}`).Async();
            await colObj.SetParent(state.root, false);

            const ct = await colObj.AddComponent(new BS.Transform());
            ct.localPosition = pos;

            // Ensure height covers whole column
            await colObj.AddComponent(new BS.BoxCollider(true, new BS.Vector3(0, 0, 0), new BS.Vector3(colWidth, gridHeight, columnDepth)));
            await colObj.SetLayer(5);

            // Name it properly for debugging
            colObj.name = `Column_${c}`;

            colObj.On('click', () => {
                console.log(`Connect4: Column ${c} clicked`);
                handleColumnClick(c);
            });
        }

        // Reset Button
        if (!config.hideUI) {
            const resetBtn = await createBanterObject(state.root, BS.GeometryType.BoxGeometry,
                { width: 0.2, height: 0.1, depth: 0.05 },
                '#333333',
                config.resetPosition,
                true // Has Collider
            );

            let rt = resetBtn.GetComponent(BS.ComponentType.Transform);
            rt.localEulerAngles = config.resetRotation;
            rt.localScale = config.resetScale;

            // Add Collider to reset button! (createBanterObject now adds it)
            // But waiting for createBanterObject update below.

            resetBtn.On('click', () => {
                console.log("Connect4: Reset clicked");
                state.game.reset();
                syncState();
            });
        }

        setupListeners();
        checkForExistingState();
        console.log("Connect4: Setup Scene Complete");
    }

    function getGeoArgs(type, dims) {
        // Defaults: width=1, height=1, depth=1, segments=24, radius=0.5
        const w = dims.width || 1;
        const h = dims.height || 1;
        const d = dims.depth || 1;
        const r = dims.radius || 0.5;
        const PI2 = 6.283185;

        // We only need to pass arguments up to what is required for the specific geometry.
        if (type === BS.GeometryType.BoxGeometry) {
            return [type, null, w, h, d];
        } else if (type === BS.GeometryType.SphereGeometry) {
            // Sphere specific args for smoothness
            return [
                type, null, w, h, d,
                24, 16, 1, // widthSeg, heightSeg, depthSeg
                r, 24, // radius, segments
                0, PI2, 0, PI2,
                8, false,
                r, r
            ];
        } else if (type === BS.GeometryType.CylinderGeometry) {
             // Cylinder needs radiusTop/Bottom (args 16, 17) and height (arg 3)
             return [
                type, null, 
                1, h, 1, // Use dims.height for the height parameter
                1, 1, 1,
                r, 24, // Use dims.radius and a default segment count
                0, PI2, 0, PI2,
                8, false,
                r, r // radiusTop, radiusBottom
            ];
        } else {
            // Fallback for other geometry types
            return [
                type, null, w, h, d, 1, 1, 1,
                r, 24, 0, PI2, 0, PI2, 8, false,
                r, r,
                0, 1, 24, 8, 0.4, 16, PI2, 2, 3, 5, 5, 0, ""
            ];
        }
    }

    async function createBanterObject(parent, type, dims, colorHex, pos, hasCollider = false, opacity = 1.0) {
        const obj = await new BS.GameObject("Geo").Async();
        await obj.SetParent(parent, false);

        let t = await obj.AddComponent(new BS.Transform());
        if (pos) t.localPosition = pos;

        const fullArgs = getGeoArgs(type, dims);
        await obj.AddComponent(new BS.BanterGeometry(...fullArgs));

        const color = hexToVector4(colorHex);
        color.w = opacity;

        // Use Unlit/DiffuseTransparent if opacity < 1.0 to avoid pink/missing shader issues
        const shader = opacity < 1.0 ? "Unlit/DiffuseTransparent" : "Unlit/Diffuse";
        await obj.AddComponent(new BS.BanterMaterial(shader, "", color, BS.MaterialSide.Front, false));

        // Add Collider
        if (hasCollider) {
            let colSize;
            if (type === BS.GeometryType.BoxGeometry) {
                colSize = new BS.Vector3(dims.width || 1, dims.height || 1, dims.depth || 1);
            } else {
                // Cylinder/Sphere approximation
                const r = dims.radius || 0.5;
                const h = dims.height || 1;
                colSize = new BS.Vector3(r * 2, h, r * 2);
            }
            await obj.AddComponent(new BS.BoxCollider(true, new BS.Vector3(0, 0, 0), colSize));
            await obj.SetLayer(5);
        }

        return obj;
    }

    function handleColumnClick(col) {
        if (state.game.winner) return;
        if (state.isSyncing) {
            console.log("Connect4: Input Locked (Syncing or Spam Protection)");
            return;
        }

        // Simulate drop without mutating local state
        const nextState = state.game.simulateDrop(col);
        if (nextState) {
            console.log("Connect4: Locking Input & Sending Move...");
            state.isSyncing = true; // Engage Lock
            syncState(nextState);
        }
    }

    function syncState(newState) {
        const key = `connect4_game_${config.instance}`;
        // Use provided state or fallback to current local state
        const data = newState || state.game.getState();
        BS.BanterScene.GetInstance().SetPublicSpaceProps({ [key]: JSON.stringify(data) });
        // Lock-Step: We do NOT update visuals here. We wait for server echo.
    }

    function updateVisuals() {
        // Update pieces
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 7; c++) {
                const cell = state.game.board[r][c];
                const pieceObj = state.slots[r][c];

                if (cell === 0) {
                    pieceObj.SetActive(false);
                } else {
                    pieceObj.SetActive(true);
                    let color = COLORS.empty;
                    if (cell === 1) color = COLORS.red;
                    if (cell === 2) color = COLORS.yellow;

                    // Highlight winning cells
                    if (state.game.winningCells.some(([wr, wc]) => wr === r && wc === c)) {
                        // Flash or change color? Let's just make them Greenish or bright
                        color = COLORS.winHighlight;
                    }

                    // Update material color
                    const mat = pieceObj.GetComponent(BS.ComponentType.BanterMaterial);
                    if (mat) mat.color = hexToVector4(color);
                }
            }
        }
    }

    async function checkForExistingState() {
        const key = `connect4_game_${config.instance}`;
        const scene = BS.BanterScene.GetInstance();

        // Helper to get prop
        const getProp = () => {
            const s = scene.spaceState;
            return (s.public && s.public[key]) || (s.protected && s.protected[key]);
        };

        let val = getProp();
        // Wait a bit if not ready? Usually 'unity-loaded' implies ready.

        if (val) {
            try {
                const data = JSON.parse(val);
                state.game.loadState(data);
                updateVisuals();
            } catch (e) {
                console.error("Failed to parse connect4 state", e);
            }
        }
    }

    function setupListeners() {
        const key = `connect4_game_${config.instance}`;
        BS.BanterScene.GetInstance().On("space-state-changed", e => {
            const changes = e.detail.changes;
            if (changes && changes.find(c => c.property === key)) {
                // Determine new value
                const scene = BS.BanterScene.GetInstance();
                const s = scene.spaceState;
                const val = (s.public && s.public[key]) || (s.protected && s.protected[key]);

                if (val) {
                    try {
                        console.log("Connect4: Received State Change -> Loading & Unlocking");
                        const data = JSON.parse(val);
                        state.game.loadState(data);
                        updateVisuals();
                        state.isSyncing = false;
                    } catch (e) { console.error(e); }
                }
            }
        });
    }

    init();
})();
