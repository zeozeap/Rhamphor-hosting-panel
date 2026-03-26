# File Manager

The File Manager is available on the **Files** tab of any server detail page. It provides a full in-browser interface for managing files on the game server node.

---

## Browsing

- The file list shows the current directory's contents
- Folders are listed first, then files
- Click a **folder** to navigate into it
- Click a **file** to open its contents in the editor
- Use the **breadcrumb path** at the top to navigate back up the tree

---

## Toolbar

The toolbar at the top of the Files tab has:

| Button | Action |
|--------|--------|
| New Folder | Creates a new empty directory in the current path |
| New File | Creates a new empty file in the current path |
| Paste | Pastes the file/folder currently held in the clipboard (after Cut or Copy) |

When you click **New Folder** or **New File**, an inline input appears in the file list for you to type the name and press Enter to confirm.

---

## Right-Click Context Menu

Right-clicking any file or folder opens a context menu with the following options:

| Option | Description |
|--------|-------------|
| **Rename** | Enter a new name inline, confirm with Enter |
| **Cut** | Marks the item for a move operation |
| **Copy** | Marks the item for a copy operation |
| **Paste here** | Pastes the cut/copied item into the current directory |
| **Move to...** | Opens the Move Dialog to pick a destination directory |
| **Compress** | Creates a `.zip` archive of the file or folder |
| **Extract here** | Unzips a `.zip` file in place (disabled for non-zip files and folders) |
| **Delete** | Permanently deletes the file or folder (recursive) |

---

## Inline Rename

When **Rename** is selected from the context menu:

1. The file/folder name in the list becomes an editable text input
2. Type the new name
3. Press **Enter** to confirm, **Escape** to cancel

---

## Move Dialog

The **Move to...** option opens a dialog with:

- A **directory tree browser** that lazily loads subdirectories as you expand them
- Clicking a directory in the tree updates the destination path
- A **text input** that shows the current destination path — you can also type directly
- The **source directory is hidden** from the tree to prevent moving a folder into itself
- The **Move button** is disabled when the destination equals the source

### Conflict Handling

| Situation | Response |
|-----------|----------|
| Destination same as source | Blocked (400) |
| Destination is inside source subtree | Blocked (400) — prevents recursive moves |
| Destination already contains an item with the same name | Blocked (409 Conflict) |

---

## Compress

Right-click a file or folder and choose **Compress** to create a `.zip` archive at the same location.

Example: Compressing `plugins/` creates `plugins.zip` in the same parent directory.

---

## Extract Here

Right-click a `.zip` file and choose **Extract here** to unzip its contents into the current directory.

- Only available for `.zip` files
- Disabled (greyed out) for folders and non-zip files

---

## File Editor

Clicking a file opens it in the editor panel:

- Plain text editor with syntax detection
- Changes are saved with the **Save** button or `Ctrl+S`
- Large files may be truncated in the editor view

---

## Error Feedback

After any operation (create, rename, move, compress, etc.), a banner appears at the top of the file list:

- **Green** — success
- **Red** — error (with the error message from the server)

Banners auto-dismiss after 3 seconds.

---

## Access Control

All file operations require:
1. The user to be authenticated (`requireAuth`)
2. The user to own the server or be an admin (`requireServerAccess`)

Path traversal outside the server's data directory is blocked at the Flaps level.
