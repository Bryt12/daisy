import { Petal, PetalFactory } from "../types/petal.ts";

export class PetalStore {
  // This maps the hash of the petal to the petal object
  static petals: Map<string, Petal> = new Map();

  /**
   * Loops through the yaml files in the petals directory and loads them into memory.
   *
   * This is a static class method, so it can be called without instantiating the class.
   * This is useful because we only need one instance of the PetalStore class. So
   * the files only need to be loaded once.
   *
   * @param petalDir
   */
  static async loadPetals(petalDir: string) {
    console.log("Loading petals from " + petalDir + "...");
    const petalFiles = await Deno.readDir(petalDir);

    if (petalFiles === null) {
      throw new Error(
        "models/petalStore.model.ts - loadPetals - No petals found",
      );
    }

    // Loop through each file in the petals directory
    for await (const petalFile of petalFiles) {
      if (petalFile.isFile && petalFile.name.endsWith(".yaml")) {
        // Use the petal factory to create a petal object
        const petal = await PetalFactory.fromYamlFile(
          petalDir + "/" + petalFile.name,
        );

        // Add the petal to the map
        this.petals.set(petal.getHash(), petal);
      }
    }

    console.log("Loaded " + this.petals.size + " petal(s)!");
  }

  /**
   * Returns a petal object from the hash.
   *
   * @param hash - The hash of the petal to get.
   * @returns The petal object.
   */
  static getPetal(hash: string) {
    return PetalStore.petals.get(hash);
  }

  static getPetalByName(name: string) {
    for (const petal of PetalStore.petals.values()) {
      if (petal.getName() === name) {
        return petal;
      }
    }
  }

  static getPetals() {
    // Return an array of the petal objects
    return Array.from(PetalStore.petals.values());
  }
}
