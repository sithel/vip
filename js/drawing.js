drawing = {
  /* info: 
  [0] - id, 
  [1] - display name (short), 
  [2] - brief desc, 
  [3] - can customize folio count
  [4] - default folio count
  [5] - list of folios per sheet
  [6] - long desc 
  */
  renderImpositionOptions: function(el, info, i){
    let newNode = document.createElement("div");
    s = `
    <input type="radio" name="page_imposition" value="single" id="`+info[0]+`" onchange='vip.handlePageImpositionUpdate(`+i+`)'>
    <label for="`+info[0]+`">`+info[1]+`</label><br>
    <small><label for="`+info[0]+`">`+info[2]+`</label></small>
    `
    newNode.id = 'option_'+info[0]
    newNode.setAttribute("class","imposition_option")
    newNode.innerHTML = s;
    el.appendChild(newNode)
  },
  /* writes to the document then and there our SVG stuff*/
  renderPageRotationDemo : function(el, aRot, bRot, cRot, scale, checked){
    let name = el.id + "_radio"
    let id = el.id.substr(-1,1)
    let checkedText = checked ? " checked" : ""
    if (checked) {
      window.book.page_orientation = name
    }
    let s = `
    <svg version="1.1" 
width="`+scale+`px"
viewBox="0.0 0.0 197.6482939632546 280.6719160104987" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="p.0"><path d="m0 0l197.6483 0l0 280.6719l-197.6483 0l0 -280.6719z" clip-rule="nonzero"/></clipPath>
  <g clip-path="url(#p.0)" transform="scale(1,1)"><path fill="#000000" fill-opacity="0.0" d="m0 0l197.6483 0l0 280.6719l-197.6483 0z" fill-rule="evenodd"/><path fill="#cfe2f3" d="m99.438324 4.0577426l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m99.438324 4.0577426l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/><path fill="#000000" fill-opacity="0.0" d="m100.603676 4.0577426l0 127.11812" fill-rule="evenodd"/><path stroke="#000000" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m100.603676 4.0577426l0 127.11812" fill-rule="evenodd"/><path fill="#000000" fill-opacity="0.0" d="m112.16273 13.3044615l75.11811 0l0 105.16536l-75.11811 0z" fill-rule="evenodd"/>  
  <g transform="rotate(`+aRot+` 146.99213 63.71391)">
<path fill="#000000" d="m124.71484 92.56713l20.515625 -53.437496l7.625 0l21.875 53.437496l-8.0625 0l-6.234375 -16.1875l-22.34375 0l-5.859375 16.1875l-7.515625 0zm15.421875 -21.9375l18.109375 0l-5.578125 -14.812496q-2.546875 -6.734375 -3.78125 -11.078125q-1.03125 5.140625 -2.890625 10.203125l-5.859375 15.687496z" fill-rule="nonzero"/>
  </g>
<path fill="#cfe2f3" d="m99.438324 149.49606l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m99.438324 149.49606l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/><path fill="#000000" fill-opacity="0.0" d="m100.603676 149.49606l0 127.1181" fill-rule="evenodd"/><path stroke="#000000" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m100.603676 149.49606l0 127.1181" fill-rule="evenodd"/><path fill="#000000" fill-opacity="0.0" d="m112.16273 158.74278l75.11811 0l0 105.16536l-75.11811 0z" fill-rule="evenodd"/>
<g transform="rotate(`+cRot+` 147.36745 211.45932)">
  <path fill="#000000" d="m166.65523 219.27107l7.078125 1.78125q-2.234375 8.71875 -8.015625 13.296875q-5.765625 4.5625 -14.125 4.5625q-8.640625 0 -14.046875 -3.515625q-5.40625 -3.515625 -8.234375 -10.1875q-2.8281174 -6.671875 -2.8281174 -14.328125q0 -8.34375 3.1874924 -14.5625q3.1875 -6.21875 9.078125 -9.4375q5.890625 -3.234375 12.953125 -3.234375q8.03125 0 13.5 4.09375q5.46875 4.078125 7.609375 11.484375l-6.953125 1.640625q-1.859375 -5.84375 -5.40625 -8.5q-3.53125 -2.65625 -8.890625 -2.65625q-6.15625 0 -10.296875 2.953125q-4.140625 2.953125 -5.8125 7.9375q-1.671875 4.96875 -1.671875 10.25q0 6.8125 1.984375 11.90625q1.984375 5.078125 6.171875 7.59375q4.1875 2.515625 9.078125 2.515625q5.9375 0 10.0625 -3.421875q4.125 -3.4375 5.578125 -10.171875z" fill-rule="nonzero"/>
</g>
<path fill="#cfe2f3" d="m3.4383202 149.49606l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m3.4383202 149.49606l94.77165 0l0 125.98425l-94.77165 0z" fill-rule="evenodd"/>
<path fill="#000000" fill-opacity="0.0" d="m16.16273 158.74278l75.11811 0l0 105.16536l-75.11811 0z" fill-rule="evenodd"/>
<g transform="rotate(`+bRot+` 49.624672 210.14436)">
<path fill="#000000" d="m34.29297 238.00545l0 -53.4375l20.046875 0q6.125 0 9.828125 1.625q3.703125 1.609375 5.796875 4.984375q2.09375 3.375 2.09375 7.0625q0 3.421875 -1.859375 6.453125q-1.859375 3.015625 -5.609375 4.875q4.84375 1.421875 7.453125 4.859375q2.609375 3.421875 2.609375 8.078125q0 3.765625 -1.59375 7.0q-1.578125 3.21875 -3.921875 4.96875q-2.328125 1.75 -5.84375 2.640625q-3.515625 0.890625 -8.625 0.890625l-20.375 0zm7.078125 -30.984375l11.546875 0q4.703125 0 6.75 -0.625q2.6875 -0.796875 4.046875 -2.65625q1.375 -1.859375 1.375 -4.671875q0 -2.65625 -1.28125 -4.671875q-1.265625 -2.03125 -3.640625 -2.78125q-2.359375 -0.75 -8.125 -0.75l-10.671875 0l0 16.15625zm0 24.671875l13.296875 0q3.421875 0 4.8125 -0.25q2.4375 -0.4375 4.078125 -1.453125q1.640625 -1.03125 2.703125 -2.96875q1.0625 -1.953125 1.0625 -4.515625q0 -2.984375 -1.53125 -5.1875q-1.53125 -2.203125 -4.25 -3.09375q-2.71875 -0.890625 -7.828125 -0.890625l-12.34375 0l0 18.359375z" fill-rule="nonzero"/>
</g></g></svg>

<!--  ====[ see BELOW for click handling logic ]=== -->

    <input type="radio" id="`+name+`" 
        data-page-orientation-id="`+id+`" data-page-orientation-left=`+bRot+` data-page-orientation-right=`+aRot+`
        class="page_orientation_radio" name="page_orientation" value="`+name+`" onchange="vip.handlePageOrientationUpdate(this)" `+checkedText+`/>
    `
    el.innerHTML = s;
  },
  addUploadBlock : function(parent, addBtn, isInitial) {
    let newNode = document.createElement("section");
    let idNum = window.book.upload_blocks.length;
    let showDeleteBtn = (isInitial) ? "" : '<button class="contrast" data-upload-index='+idNum+' onclick="vip.removeUploadBlock(this)">remove</button>'
    newNode.innerHTML = `
            <input class="page_count" type="number" min="0" name="text" placeholder="0" data-upload-index="`+idNum+`" onchange="vip.uploadBlockBlank(this)"/>
            <small>preceding blank page count</small>
            <input type="file" id="file" name="file" accept=".pdf" data-upload-index="`+idNum+`" onchange="vip.uploadBlockPdf(this)"/><br>
            <input class="page_count" type="text" name="text" data-upload-index="`+idNum+`" onchange="vip.uploadBlockPageSelection(this)" placeholder="all" />
            <small>page selection</small><br>
            `+showDeleteBtn+`
    `
    newNode.className = "upload_block";
    newNode.setAttribute("id", "upload_block_"+idNum);
    parent.insertBefore(newNode,addBtn);
    window.book.upload_blocks[idNum] = {};
    window.reb = parent;
  },
  updatePdfOrientationExample: function() {
    console.log("   > drawing.updatePdfOrientationExample")
    let deets = window.book.unified_source;
    if (deets.pdf == undefined) {
      return
    }
    let spineWidth = 5;
    const {w, h, isTurned} = window.book.unified_source.calcRotationPreviewRenderInfo()
    const marginDeets = "width:"+w+"px;height:"+h+"px;display:block;background:red;margin-bottom:10px;"
    document.getElementById("example_pdf_margin_block").setAttribute("style",marginDeets);
    let basePageDeets = `width:${(isTurned) ? h : w}px;height:${(isTurned) ? w : h}px;`
    document.getElementById("example_pdf_orientation_page_left").setAttribute("style",basePageDeets);
    document.getElementById("example_pdf_orientation_page_right").setAttribute("style",basePageDeets)
    let spineDeets = `width:${spineWidth}px;height:${(isTurned)? w : h}px;`
    document.getElementById("example_pdf_orientation_spine").setAttribute("style",spineDeets)
    document.getElementById("example_pdf_orientation").setAttribute("style","")
  },
  renderPreviewSvg: function(el) {
    const color1 = `repeating-linear-gradient(
    133deg,
    #ffeb3b3b,
    #ffc1078c 10px,
    #ff9800 10px,
    #ff9800 15px
  )`
    const cell_w = Math.random() * 100 + 50 // comes from imposition + paper
    const cell_h = Math.random() * 150 + 50
    const w = Math.random() * 100 + 150     // comes from pdf input + pdf margin + pdf rotation
    const h = Math.random() * 150 + 50
    const padding = {                       // comes from user input PDF Placement Padding
      top: Math.random() * 10 + -5,
      bottom: Math.random() * 10 + -5,
      left: Math.random() * 10 + -5,
      right: Math.random() * 10 + -5
    }
    const scale_mode = "fit"                // comes from user input pdf_page_scaling
    const placement_mode = "snug_top"       // comes from user input pdf_white_space_placement

    el.innerHTML = `
          <defs>
            <linearGradient id="Gradient-1"x1="3%" y1="4%" x2="6%" y2="6%">
                <stop offset="0%" stop-color= "red" />
                <stop offset="50%" stop-color= "white" />
              </linearGradient>
            <linearGradient id="repeat-1"xlink:href="#Gradient-1"spreadMethod="repeat" />
            <linearGradient id="Gradient-2"x1="-3%" y1="-4%" x2="6%" y2="6%">
                <stop offset="0%" stop-color= "green" />
                <stop offset="50%" stop-color= "transparent" />
              </linearGradient>
            <linearGradient id="repeat-2"xlink:href="#Gradient-2"spreadMethod="repeat" />
            <pattern id="pattern"
                     width="12" height="10"
                     patternUnits="userSpaceOnUse">
              <rect x="0" y="0" fill="#00f" width="4" height="10"></rect>
              <rect x="4" y="0" fill="#f00" width="4" height="10"></rect>
              <rect x="8" y="0" fill="#0f0" width="4" height="10"></rect>
            </pattern>
          </defs>
          <rect x="25" y=0 width="`+cell_w+`" height="`+cell_h+`"  fill= "url(#pattern)"></rect>
          <rect x="40" y="10" width="`+w+`" height="`+h+`"  fill= "url(#repeat-2)"></rect>
          <rect x="20" y="0" width="5" height="`+cell_h+`" style="fill:rgb(84 98 45 / 43%);"></rect>
          <text x="-50" y="15" class="small" transform="rotate(-90 0 0)" style="color:rgb(1 1 1 / 78%);">spine</text>
    `
  }
}