export const form = {
  addUploadBlock : function(parent, addBtn) {
    let newNode = document.createElement("section");
    newNode.innerHTML = `
            <input class="page_count" type="number" name="text" placeholder="0" />
            <small>preceeding blank page count</small>
            <input type="file" id="file" name="file" accept=".pdf"/>
            <button class="contrast" onclick="vip.removeUploadBlock(this)">remove</button>
    `
    newNode.className = "upload_block"
    parent.insertBefore(newNode,addBtn)
  },
  removeUploadBlock : function(parent, removeBtn) {
    parent.removeChild(removeBtn)
  }
}