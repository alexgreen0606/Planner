# Code Style Guide

## Order of Files  
When declaring, follow this order (exported after local):
1. `enum`
2. `const`
3. `type`
4. `interface`
5. `function`

## Flow of Files 
When declaring, follow this order (exported after local):
1. `atoms`
2. `external data`
6. `constants (fallback)`
2. `context`
3. `state`
4. `MMKV`
4. `animated variables`
6. `constants (prefer)`
6. `hooks`
5. `useEffect`
1. `functions`
7. `UI`

## Function Names
Event handlers: 'handle'. Props: 'on'. All else just state what it does.
1. `atoms`
2. `external data`
1. `ref`
6. `constants (fallback)`
2. `context`
3. `state`
4. `MMKV`
4. `animated variables`
6. `constants (prefer)`
6. `hooks`
5. `useEffect`
1. `functions`
7. `UI`

## Props  
- Always define props using `interface`.

## Functions
- All functions **must** explicitly show their return type if it exists.

## Comments  
- Always leave an **empty line** before a comment, unless describing an if/else block interior.

## Interfaces and Types  
- **Props** should always be defined in the pertaining file.  
- **Configurations** should always be defined as `type` and placed in the `utils` file.

## Naming Conventions  
- Use `get` for things that already exist.  
- Use `generate` for creating new things.

## Colors
- `backgrounds`: systemGray6  
- `dim`: systemGray3


I'd like to work on some refactoring of this file. Please organize things nicely and section them off, with a label separating the sections of the format:

// ------------- Animation and Gesture State -------------

Please also add in comments of the format:

/**
     * 
     * @param itemId 
     * @returns 
     */

Also use functions instead of arrow functions wherever possible.

Only use implementation comments where necessary.

Ensure the code is as clean and easy to read as possible.