# outbreak-contracts

Versioned protocol package shared by the frontend and backend.

This package intentionally contains only DTOs, protocol constants and game-rule constants that must match on both sides. It must not import Angular, Phaser, NestJS or Colyseus.

In production, publish this package to a private registry and pin compatible semver ranges in each repo.
