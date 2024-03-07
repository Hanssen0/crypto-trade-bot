<h1 align="center" style="font-size: 48px;">
  Crypto Trading Bot
</h1>

<p align="center">
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/Hanssen0/crypto-trade-bot">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/Hanssen0/crypto-trade-bot/master">
</p>

<p align="center">
  An open-sourced crypto trading bot for strategy trading on centralized exchanges.
</p>

## Strategies

* Dollar cost averaging (DCA)

## Features

* State machine-based processing for maximum reliability.
* Extendable architecture to support more strategies in the future.
* Support many exchanges by using [`ccxt`](https://github.com/ccxt/ccxt).

## 🐋 Running in Docker

### From GitHub Package

1. Clone repo or download [`config.yaml`](./config/config.example.yaml) and [`docker-compose.ghcr.yaml`](./docker-compose.ghcr.yaml)
2. Edit (and rename) the `config.example.yaml`
3. Edit the `docker-compose.ghcr.yaml`, specify your config file path

    ``` yaml
    - <YOUR_CONFIG_FILE_PATH>:/app/config/config.yaml
    ```

4. Run all containers

     ```shell
     docker compose -f docker-compose.ghcr.yaml up -d
     ```

## Background

Strategy trading bots are ideal for people who want to invest money in cryptos automatically.

However, only some exchanges provide bot features, or you must ask for help from third-party platforms. They usually charge users extra fees, and these volume-based fees could be expensive. Moreover, third-party platforms may lead to security problems since they can manipulate users' all assets.

This project is an open-sourced bot. You can freely host it on your server for complete control without extra fees.

## TODO

* Buy with funds in the Binance Simple Earn.
* Subscribe to flexible products with bought tokens automatically.