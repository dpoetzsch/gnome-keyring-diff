
This program can be used to check how two gnome keyrings differ from each other.
This is useful for example if there was a synchronization problem and you end up with a forked version of the original keyring.

# Usage

First, download and build the project:

1. Download the project
2. Run `npm install`
3. Run `npm run build`

The use this to run it:

```bash
gjs dist/gnome-keyring-diff.js <keyring1> <keyring2>
```

The keyring names are URL encoded versions of the keyring file names found in `~/.local/share/keyrings`.
