import { KeyringConnection } from "gnome-keyring-js/src/main";

interface Item {
    label: string;
    path: string;
    locked?: boolean;
}

class Keyring {
    public items: Item[] = [];
    constructor(
        private readonly con: KeyringConnection,
        public readonly name: string,
    ) {}

    fillItemsFromAll(allItems: Item[]) {
        this.items = allItems.filter(i => {
            return i.path.indexOf(`/org/freedesktop/secrets/collection/${this.name}`) !== -1;
        });
    }

    diff(other: Keyring) {
        for (const item of this.items) {
            const otherItem = other.getItemWithLabel(item.label);

            if (otherItem) {
                this.diffItems(item, otherItem);
            } else {
                console.log(`Only in ${this.name}: ${item.label}`);
            }
        }

        for (const item of other.items) {
            if (!this.getItemWithLabel(item.label)) {
                console.log(`Only in ${other.name}: ${item.label}`);
            }
        }

        console.log("finished");
    }

    diffItems(item1: Item, item2: Item) {
        this.con.getSecretFromPath(item1.path, (label1, secret1) => {
            this.con.getSecretFromPath(item2.path, (label2, secret2) => {
                if (secret1 !== secret2) {
                    console.log(`Item secrets differ: ${label1}`);
                }
            });
        });
    }

    getItemWithLabel(label: string): Item | null {
        for (const i of this.items) {
            if (i.label === label) {
                return i;
            }
        }
        return null;
    }
}

function listKeyrings(collections: Item[], logger = console.log) {
    for (const c of collections) {
        const s = c.path.split("/");
        logger(s[s.length - 1]);
    }
}

function main() {
    if (ARGV.length < 1 || (ARGV.length === 1 && ARGV[0] !== 'list')) {
        console.error("Usage:");
        console.error("    gjs gnome-keyring-diff.js list");
        console.error("    gjs gnome-keyring-diff.js <keyring1> <keyring2>");
        return 1;
    }

    const con = new KeyringConnection();

    const collections = con.getCollections();

    if (ARGV.length === 1 && ARGV[0] === 'list') {
        listKeyrings(collections);
        return 0;
    }

    const selectedCollections = collections.filter(c => {
        return c.path === `/org/freedesktop/secrets/collection/${ARGV[0]}` ||
            c.path === `/org/freedesktop/secrets/collection/${ARGV[1]}`;
    });

    if (selectedCollections.length !== 2) {
        console.error("At least one keyring was not found. Here are the available keyrings:");
        listKeyrings(collections, console.error);
        return 2;
    }

    const items = con.getAllItems();

    const keyring1 = new Keyring(con, ARGV[0]);
    const keyring2 = new Keyring(con, ARGV[1]);

    keyring1.fillItemsFromAll(items);
    keyring2.fillItemsFromAll(items);

    keyring1.diff(keyring2);

    imports['mainloop'].run();

    return 0;
}

main();
