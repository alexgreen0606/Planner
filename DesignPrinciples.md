# Code Style Guide

## Order of Files  
When declaring, follow this order (exported after local):
1. `enum`
2. `const`
3. `type`
4. `interface`
5. `function`

## Props  
- Always define props using `interface`.

## Functions
- All functions **must** explicitly show their return type if it exists.

## Comments  
- Always leave an **empty line** before a comment.

## Interfaces and Types  
- **Props** should always be defined in the pertaining file.  
- **Configurations** should always be defined as `type` and placed in the `utils` file.

## Naming Conventions  
- Use `get` for things that already exist.  
- Use `generate` for creating new things.
