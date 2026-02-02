/**
 * COMPATIBILITY SHIM for 3d-bin-packing
 * This library is legacy and expects samchon and tstl to be in the global scope.
 */
import * as samchon from 'samchon';
import * as tstl from 'tstl';

if (typeof global !== 'undefined') {
  (global as any).samchon = samchon;
  (global as any).std = tstl;
}

// Use require to ensure the shim is set up before loading the library
const packer = require('3d-bin-packing');
import { SHIPPING_BOX_CATALOG } from '@/lib/config/site';

export interface PackableItem {
  id: string;
  width: number;
  length: number;
  height: number;
  weight: number;
  quantity: number;
}

export interface PackedParcel {
  boxId: string;
  boxName: string;
  width: number;
  length: number;
  height: number;
  weight: number;
  items: {
    id: string;
    quantity: number;
  }[];
}

/**
 * Service to handle 3D Bin Packing for shipping optimization.
 * Uses the 3d-bin-packing library to find the best box(es) for a set of items.
 */
export class PackingService {
  /**
   * Optimizes packing by selecting the best box from the catalog.
   * Returns a list of parcels required to ship the items.
   */
  static pack(items: PackableItem[]): PackedParcel[] {
    const wrapperArray = new packer.WrapperArray();
    const instanceArray = new packer.InstanceArray();

    // 1. Load the Box Catalog into WrapperArray
    SHIPPING_BOX_CATALOG.forEach(box => {
      // Wrapper(name, price, width, height, length, thickness)
      // Note: price is used for optimization (lowest cost), thickness is usually 0
      (wrapperArray as any).push_back(
        new packer.Wrapper(box.id, 0, box.width, box.height, box.length, 0)
      );
    });

    // 2. Load the items into InstanceArray
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        (instanceArray as any).push_back(
          new packer.Product(item.id, item.width, item.height, item.length)
        );
      }
    });

    // 3. Initialize Packer and Optimize
    const myPacker = new packer.Packer(wrapperArray, instanceArray);

    // The optimize() method returns the best WrapperArray (list of packed boxes)
    const result = myPacker.optimize();

    const packedParcels: PackedParcel[] = [];

    // 4. Convert result to our domain interface
    // result is a WrapperArray
    for (let i = 0; i < (result as any).size(); i++) {
      const wrapper = (result as any).at(i);

      // If the wrapper contains any items
      if (wrapper.size() > 0) {
        const itemMap = new Map<string, number>();
        let totalWeight = 0;

        // Calculate total weight and group items
        for (let j = 0; j < wrapper.size(); j++) {
          const wrapRecord = wrapper.at(j);
          const instance = wrapRecord.getInstance();
          const id = instance.getName();

          itemMap.set(id, (itemMap.get(id) || 0) + 1);

          // Find the original item weight
          const originalItem = items.find(it => it.id === id);
          if (originalItem) {
            totalWeight += originalItem.weight;
          }
        }

        const itemsInBox = Array.from(itemMap.entries()).map(([id, qty]) => ({
          id,
          quantity: qty,
        }));

        const boxConfig = SHIPPING_BOX_CATALOG.find(
          b => b.id === wrapper.getName()
        );

        packedParcels.push({
          boxId: wrapper.getName(),
          boxName: boxConfig?.name || wrapper.getName(),
          width: wrapper.getWidth(),
          length: wrapper.getLength(),
          height: wrapper.getHeight(),
          weight: Math.round(totalWeight * 100) / 100,
          items: itemsInBox,
        });
      }
    }

    return packedParcels;
  }
}
