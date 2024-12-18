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
  },
  setSelectedImpositionInfo: function(imp_info){ 
    document.getElementById("imposition_more_info_text").innerHTML = imp_info[6]
    if (window.book.imposition["canCustomizeCounts"])
      document.getElementById("folios_per_signature").removeAttribute("disabled")
    else {
      document.getElementById("folios_per_signature").value = ""
      document.getElementById("folios_per_signature").setAttribute("disabled", "")
    }
    if (window.book.imposition["defaultFolioCounts"] == -1)
      document.getElementById("folios_per_signature").setAttribute("placeholder", "")
    else 
      document.getElementById("folios_per_signature").setAttribute("placeholder", imp_info[4])
  },
  _populate_signature: function(start_page_num, sheet_i, folio_i, signature_size) {
    const isStartOfSheet = folio_i == 0;
    const next_page_num = start_page_num + signature_size * 4
    const folio_per_page = window.book.imposition.foliosPerSheet.reduce((acc, x) => acc + x, 0)
    const sigPlacement = []
    let new_sig = Array.from({ length: signature_size }, (v, i) => {
      const start = start_page_num + i * 2
      const end = next_page_num - i * 2
      const new_folio = [start, start + 1, end - 2, end - 1]
      window.book.imposed.sheets[sheet_i].push(new_folio)
      sigPlacement.push([sheet_i, folio_i])
      console.log("  > "+i+"/"+signature_size+" -> ["+sheet_i+"]["+folio_i+"] = ("+new_folio.join(", ")+")")
      if (++folio_i >= folio_per_page) {
        folio_i = 0
        sheet_i += 1
        window.book.imposed.sheets[sheet_i] = []
      }
      return new_folio
    })
    const pages = new Set(sigPlacement.map(s => s[0]))
    if (pages.size > 1 && !isStartOfSheet) {
      console.log("   >> WARNING : signature awkwardly spans multiple pages - "+pages)
      window.book.imposed.hasSplitSig = true
    }
    if (pages.size == 1 && !isStartOfSheet) {
      console.log("   >> WARNING : signature needs to be cut on page "+pages.keys().next().value)
      window.book.imposed.requiresCutting = true
    }
    return [next_page_num, sheet_i, folio_i, new_sig]
  },
  _populateSheets: function(sig_sequence) {
    console.log(" > _populateSheets: ["+sig_sequence+"]")
    window.book.imposed.sheets = [[]];
    window.book.imposed.signatures = [];
    window.book.imposed.hasSplitSig = false;
    window.book.imposed.requiresCutting = false;
    let max_page_num = window.book.unified_source.pageCount;
    let sig_start = 0;
    let sheet_i = 0;
    let folio_i = 0;
    const populate_signature = this._populate_signature
    const reducer = function(next_page_num, signature_size){
      let new_sig = null;
      const calculatedEnd = next_page_num + signature_size * 4;
      const adjustedEnd = Math.ceil((max_page_num - next_page_num) / 4);
      signature_size = (calculatedEnd > max_page_num) ? adjustedEnd : signature_size;
      [next_page_num, sheet_i, folio_i, new_sig] = populate_signature(next_page_num, sheet_i, folio_i, signature_size);
      window.book.imposed.signatures.push(new_sig);
      return next_page_num;
    }
    while (sig_start < max_page_num) {
      sig_start = sig_sequence.reduce(reducer, sig_start)
    }
  },
  _customImposeSingle: function(pageCount) {
    const outputEl = document.getElementById("imposition_folio_calculations")
    outputEl.removeAttribute("style")
    outputEl.innerHTML = "<small>Given "+pageCount+" PDF pages<br> ➥ "+ Math.ceil(pageCount/2)+" sheets</small>"
  },
  _customImposeZine: function(pageCount) {
    const outputEl = document.getElementById("imposition_folio_calculations")
    outputEl.removeAttribute("style")
    outputEl.innerHTML = "<small>Given "+pageCount+" PDF pages<br> ➥ "+ Math.ceil(pageCount/8)+" sheets</small>"
  },
  calImpositionInfo: function(pageCount) {
    const defaultCount = window.book.imposition["defaultFolioCounts"]
    const canCustomize = window.book.imposition["canCustomizeCounts"]
    const folioPerSheet = window.book.imposition["foliosPerSheet"]
    const inputEl = document.getElementById("folios_per_signature")
    const outputEl = document.getElementById("imposition_folio_calculations")

    if (defaultCount == -1) {
      outputEl.setAttribute("style", "display:none;")
      if (window.book.imposition.foliosPerSheet[0] == 0.5)
        this._customImposeSingle(pageCount)
      else if (window.book.imposition.foliosPerSheet[0] == 8)
        this._customImposeZine(pageCount)
      return;
    }

    outputEl.removeAttribute("style")
    let input = inputEl.value
    input = (input == "") ? inputEl.getAttribute("placeholder") : input
    const counts = input.split(",").filter(x => x != "").map(x => parseInt(x.trim()))
    const suggested = defaultCount.toString().split(",").map(x => parseInt(x.trim()))
    if (counts.some(x => isNaN(x))){
      outputEl.innerHTML = "<mark>Invalid input ["+inputEl.value+"] - requires single number or a comma separated list of numbers</mark>"
      return;
    }
    this._populateSheets(counts)
    let s = "<small>"
    const isSuggestion = counts.length == suggested.length && counts.every((x,i) => x == suggested[i])
    const suggestedCounts = (canCustomize && !isSuggestion) ? "<sub>suggested "+suggested.join(", ")+"</sub>" : ""
    s += "Given: " + counts.join(", ") +" folios per signature  "+suggestedCounts+"<br>"
    s += " ➥ Pages per signature: " + counts.map(x => x * 4).join(", ")+"<br>"
    s += "With "+folioPerSheet.reduce((acc, x) => acc + x, 0) + " folios per sheet<br>"
    s += "And "+ pageCount + " pages ("+Math.ceil(pageCount/4)+" folios)<br>"
    s += " ➥ "+window.book.imposed.sheets.length+" printed sheets<br>"
    s += " ➥ "+window.book.imposed.signatures.length+" signatures<br>"
    s += " ➥ "+window.book.imposed.signatures.map(x => x.length).reduce((acc, x) => acc + x, 0) * 4+" pages<br>"
    if (window.book.imposed.requiresCutting)
      s += " ✂️ Cutting required to seperate signatures<br>"
    if (window.book.imposed.hasSplitSig)
      s += "<mark> ✂️ Warning : Signatures split across sheets! Is this what you really wanted? If not, double check your folios-per-signature</mark><br>"
    outputEl.innerHTML = s +"</small>"
    
  }
}