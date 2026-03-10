
// I'll assume standard firebase/firestore imports in the app
import { db } from "../firebase";
import { collection as fireCollection, query as fireQuery, where as fireWhere, getDocs as fireGetDocs, writeBatch as fireWriteBatch, doc as fireDoc } from "firebase/firestore";

/**
 * Updates the unit name in all officer records for a given district.
 */
export async function updateUnitGlobally(oldName, newName, district) {
    try {
        const q = fireQuery(
            fireCollection(db, "officers"),
            fireWhere("district", "==", district),
            fireWhere("unit", "==", oldName)
        );
        const snap = await fireGetDocs(q);
        const batch = fireWriteBatch(db);
        snap.docs.forEach(d => {
            batch.update(fireDoc(db, "officers", d.id), { unit: newName });
        });
        await batch.commit();
        console.log(`Updated ${snap.size} officers from ${oldName} to ${newName}`);
    } catch (err) {
        console.error("Error in updateUnitGlobally:", err);
        throw err;
    }
}

/**
 * Removes the unit name (sets to empty) in all officer records for a given district.
 */
export async function removeUnitGlobally(unitName, district) {
    try {
        const q = fireQuery(
            fireCollection(db, "officers"),
            fireWhere("district", "==", district),
            fireWhere("unit", "==", unitName)
        );
        const snap = await fireGetDocs(q);
        const batch = fireWriteBatch(db);
        snap.docs.forEach(d => {
            batch.update(fireDoc(db, "officers", d.id), { unit: "" });
        });
        await batch.commit();
        console.log(`Removed unit ${unitName} from ${snap.size} officers`);
    } catch (err) {
        console.error("Error in removeUnitGlobally:", err);
        throw err;
    }
}

/**
 * Updates the subUnit name in all officer records for a given unit & district.
 */
export async function updateSubUnitGlobally(unitName, oldSubUnit, newSubUnit, district) {
    try {
        const q = fireQuery(
            fireCollection(db, "officers"),
            fireWhere("district", "==", district),
            fireWhere("unit", "==", unitName),
            fireWhere("subUnit", "==", oldSubUnit)
        );
        const snap = await fireGetDocs(q);
        const batch = fireWriteBatch(db);
        snap.docs.forEach(d => {
            batch.update(fireDoc(db, "officers", d.id), { subUnit: newSubUnit });
        });
        await batch.commit();
        console.log(`Updated ${snap.size} officers subUnit from ${oldSubUnit} to ${newSubUnit}`);
    } catch (err) {
        console.error("Error in updateSubUnitGlobally:", err);
        throw err;
    }
}

/**
 * Removes the subUnit (sets to empty) in all officer records for a given unit & district.
 */
export async function removeSubUnitGlobally(unitName, subUnitName, district) {
    try {
        const q = fireQuery(
            fireCollection(db, "officers"),
            fireWhere("district", "==", district),
            fireWhere("unit", "==", unitName),
            fireWhere("subUnit", "==", subUnitName)
        );
        const snap = await fireGetDocs(q);
        const batch = fireWriteBatch(db);
        snap.docs.forEach(d => {
            batch.update(fireDoc(db, "officers", d.id), { subUnit: "" });
        });
        await batch.commit();
        console.log(`Removed subUnit ${subUnitName} from ${snap.size} officers`);
    } catch (err) {
        console.error("Error in removeSubUnitGlobally:", err);
        throw err;
    }
}
