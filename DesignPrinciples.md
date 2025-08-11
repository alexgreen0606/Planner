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
2. `external hooks`
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

## Flow of Util Files 
2. `Types`
2. `Helper Functions`
1. `Special Functions`
6. `Upsert Functions`
4. `Getter Functions`
4. `Delete Functions`
6. `Generation Functions`
6. `Validation Functions`

## Function Names
- Event handlers: 'handle'. 
- Props: 'on'. 
All else just state what it does.

## Props  
- Always define props using `interface`.

## Functions
- All functions **must** explicitly show their return type if it exists.

## Comments  
- Always leave an **empty line** before a comment, unless describing an if/else block interior.

## Interfaces and Types  
- **Props** should always be defined in the pertaining file.

## Naming Conventions  
- Use `get` for things that already exist.  
- Use `generate` for creating new things.

## Colors
- `backgrounds`: systemGray6  
- `dim`: systemGray3