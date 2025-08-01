# Commander League Web App

## Background

Imagine if someone combined a 10-player game of basketball with HORSE, where trick shots earn more points than the normal 2 or 3 point shots you'd expect to see. You still win individual games by outscoring your opponents, but you win the league by accumulating the most points across all your games.

That’s Commander League: a unique play environment for Magic: The Gathering’s Commander format.

Each month, players build new decks and compete to earn points based on a league-defined scoring system that rewards creative, strategic, and thematic play. The player with the highest point total at the end of the month is crowned the league champion.

[Click here to view the Commander League Web App](https://mtg-commander-league.xyz/)


This application was developed so that:

1. Volunteers have a singular place to track scores, generate competitive pairings, and generally maintain point structures

2. Participants have a reference place for their performance during league in the form of leaderboards and other metrics

## About This Application

This mono repo contains both the frontend (tabernacle) and backend (tome) for the league app. 

Tabernacle was built using React and Redux Tool Kit. Once my list of desired features is complete I'd like to migrate this whole side of the repo to Typescript.

Tome is built using Django + Django Rest Framework connected to a Postgresql DB hosted on [Render](https://render.com/).


## Examples

### Pods + Point Modal
<img src="tabernacle/public/gifs/pods-modal.gif">

### Individual Metrics
<img src="tabernacle/public/gifs/metrics.gif">

