
# **TON Good Games 🎮**

## _**'Enjoy simple games with AI!'**_

### **Project Overview**

TON Good Games is an innovative Telegram Mini App that brings engaging AI-powered gaming experiences to the TON ecosystem. Players can enjoy classic games enhanced with modern AI opponents, all while seamlessly integrating with TON blockchain technology.

### The app includes:
- TicTacToe: Classic tic-tac-toe with AI opponents using the minimax algorithm.
- Chess: Chess implementation with AI opponents using the chess.js library.
- Poker: Texas Hold'em Poker against AI dealers.
- DotsAndBoxes: Classic dot and box drawing game against AI.
- Memory Match: Pattern matching with flippable cards.
- Number Mind: Code-breaking gameplay with exact and partial match feedback
And stay tuned more.

## **Key Features**

### **🎯 AI-Powered Gaming**
- Smart AI Opponents: Each game features carefully tuned AI algorithms:
- Chess: Advanced evaluation and negamax search with quiescence
- Tic-tac-toe: Unbeatable minimax algorithm
- Poker: Strategic decision making based on hand strength and pot odds
- Dots & Boxes: Position evaluation with chain prevention

### 💎 TON Integration
- Seamless TON Connect wallet integration
- Game results stored on TON blockchain
- Future potential for NFT rewards and tournaments

###🎨 Polished User Experience
- Beautiful, responsive Telegram UI components
- Smooth animations and transitions
- Intuitive touch controls
- Real-time game state updates

## Technical Innovation

### Architecture
- Built with React + TypeScript for type safety and maintainability
- Vite for lightning-fast development and optimized builds
- Clean component architecture with shared game logic

### AI Implementation
- Chess engine with position evaluation and look-ahead search
- Poker AI with hand strength calculation and betting strategy
- Adaptive difficulty levels in puzzle games

### TON Integration
- TonConnectButton for easy wallet connection
- Smart contract interaction for storing game results
- Efficient blockchain state management

### Market Potential
- Massive reach through Telegram's platform
- Growing demand for blockchain gaming
- Potential for tokenized rewards and tournaments
- Easy expansion with new games and features

### Future Development
- Multiplayer support
- Tournament system with Token prizes
- NFT rewards for achievements
- Additional games and AI improvements
- Social features and leaderboards

TON Good Games demonstrates how blockchain technology can enhance classic gaming experiences while maintaining simplicity and accessibility through the Telegram Mini Apps platform.

[View Demo](https://games.ton.gg) | [GitHub Repository](https://github.com/angvine/tongg)


# Developments & Services

TON Good Games Telegram Mini App using the following technologies
and libraries:

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x)
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI)
- [Vite](https://vitejs.dev/)

## Install Dependencies

If you have just cloned this template, you should install the project
dependencies using the command:

```Bash
npm install
```

## Scripts

This project contains the following scripts:

- `dev`. Runs the application in development mode.
- `build`. Builds the application for production.
- `lint`. Runs [eslint](https://eslint.org/) to ensure the code quality meets
  the required standards.
- `deploy`. Deploys the application to GitHub Pages.

To run a script, use the `npm run` command:

```Bash
npm run {script}
# Example: npm run build
```

## Run

Although Mini Apps are designed to be opened
within [Telegram applications](https://docs.telegram-mini-apps.com/platform/about#supported-applications),
you can still develop and test them outside of Telegram during the development
process.

To run the application in the development mode, use the `dev` script:

```bash
npm run dev
```

After this, you will see a similar message in your terminal:

```bash
VITE v5.2.12  ready in 237 ms

➜  Local:   https://localhost:8080
➜  ...
➜  press h + enter to show help
```

Here, you can see the `Local` link, available locally, and `Network` links
accessible to all devices in the same network with the current device.

To view the application, you need to open the `Local`
link (`https://localhost:8080` in this example) in your
browser:

It is important to note that some libraries in this template, such as
`@telegram-apps/sdk`, are not intended for use outside of Telegram.

Nevertheless, they appear to function properly. This is because the
`src/mockEnv.ts` file, which is imported in the application's entry point (
`src/index.ts`), employs the `mockTelegramEnv` function to simulate the Telegram
environment. This trick convinces the application that it is running in a
Telegram-based environment. Therefore, be cautious not to use this function in
production mode unless you fully understand its implications.

> [!WARNING]
> Because we are using self-signed SSL certificates, the Android and iOS
> Telegram applications will not be able to display the application. These
> operating systems enforce stricter security measures, preventing the Mini App
> from loading. To address this issue, refer to
> [this guide](https://docs.telegram-mini-apps.com/platform/getting-app-link#remote).


#### Before Deploying

Before deploying the application, make sure that you've built it and going to
deploy the fresh static files:

```bash
npm run build
```

Then, run the deployment process, using the `deploy` script:

```Bash
npm run deploy
```

## TON Connect

This boilerplate utilizes
the [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
project to demonstrate how developers can integrate functionality related to TON
cryptocurrency.

The TON Connect manifest used in this boilerplate is stored in the `public`
folder, where all publicly accessible static files are located. Remember
to [configure](https://docs.ton.org/develop/dapps/ton-connect/manifest) this
file according to your project's information.

## Useful Links

- [Platform documentation](https://docs.telegram-mini-apps.com/)
- [@telegram-apps/sdk-react documentation](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Telegram developers community chat](https://t.me/devs)
