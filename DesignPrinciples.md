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
2. `external hooks`
1. `atoms`
2. `context`
6. `custom hooks`

4. `useRef`
4. `useAnimatedRef`

3. `useState`
5. `useMemo`
4. `useMMKVObject`

4. `animated variables`
6. `constants`

5. `useEffect`
5. `useMMKVListener`
5. `useAnimatedReaction`

4. `event handlers`
1. `helper functions`
7. `UI`

## Flow of Util Files 
2. `Types`
2. `Helper Functions`
1. `Special Functions?`
6. `Create Functions`
4. `Read Functions`
6. `Update Functions`
4. `Delete Functions`
6. `Validation Functions`

## Function Names
- Declarations in components: 'handle'. 
- Props: 'on'. 
- Declarations in utils: action itself (ex: "saveToStorage"). 

## Props  
- Always define props using `type`.

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