import { form } from './helper.js';

export const basic = {
  txt : "sharks sharksss sharks",
  fun : function() { 
    console.log("hellow world, ", arguments[0]);
    window.reb = arguments[0]
  }
}

export const vip = {
  addUploadBlock: function(e) { form.addUploadBlock(e.parentElement.parentElement, e.parentElement) },
  removeUploadBlock : function(e) { form.removeUploadBlock(e.parentElement.parentElement, e.parentElement) },
  processUploads : function(e) { window.reb = e; console.log(e)}
}

