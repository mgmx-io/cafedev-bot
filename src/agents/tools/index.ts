import { addProfileNote } from "./add-profile-note";
import { loadSkillTool } from "./load-skill";
import { recallProfileNotes } from "./recall-profile-notes";
import { removeProfileNote } from "./remove-profile-note";

/** Every tool the agent can use, bound to one user. Add a new tool with one line here. */
export const buildTools = (userId: string) => ({
	add_profile_note: addProfileNote(userId),
	remove_profile_note: removeProfileNote(userId),
	recall_profile_notes: recallProfileNotes(userId),
	load_skill: loadSkillTool,
});
