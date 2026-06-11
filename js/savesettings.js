// Save imposer settings to LocalStorage 
// Does not mess with any of the other code or data structures! 
// by varve 

// Any new imposer settings that are added to the page must also be added
// to the data structure below, or it won't be saved. 

const debug = 0;
if (debug) { console.log("start"); };

const LOCAL_STORAGE_SETTINGS_KEY = "savedVipImposerSettings"
const LOCAL_STORAGE_DEFAULT_KEY = "Default"

const PRE_SETTINGS_LIST_HTML = "Saved settings: "

// name (input id= attribute, unless it's a radio then it's the name= attribute), type, value 
const DEFAULT_VIP_SETTINGS = {
	// <id>: {
	// type: <'number', 'checkbox', 'radio', etc>,
	// value: <value>
	// } 

//2. PDF Manipulation
	pdf_margin_left: {
		type: 'number',
		value: ""
	},
	pdf_margin_top: {
		type: 'number',
		value: ""
	},
	pdf_margin_bottom: {
		type: 'number',
		value: ""
	},
	pdf_margin_right: {
		type: 'number',
		value: ""
	},
	page_orientation: {
		type: 'radio',
		value: 'page_orientation_1_radio'
	},
	pdf_reverse_order: {
		type: 'checkbox',
		value: 0
	},


// 3. Printer Paper
	paper_size_options: {
		type: 'selectlist',
		value: 'LETTER'
	},
	paper_size: {
		type: 'text',
		value: ''
	},
	flip_paper: {
		type: 'radio',
		value: 'long'
	},
	paper_margin_short: {
		type: 'number',
		value: ""
	},
	paper_margin_long: {
		type: 'number',
		value: ""
	},


// meh - I'll sort the rest of these later... 

	unit_selector: {
		type: 'selectlist',
		value: 'points'
	},
	pdf_pre_processing: {
		type: 'selectlist',
		value: 'none'
	},
	paper_size_options: {
		type: 'selectlist',
		value: 'LETTER'
	},
	folios_per_signature: {
		type: 'text',
		value: ''
	},
	page_imposition: {
		type: 'radio',
		value: ''
	},
	pdf_page_scaling: {
		type: 'selectlist',
		value: 'fit'
	},
	pdf_padding_inner: {
		type: 'number',
		value: ""
	},
	pdf_padding_top: {
		type: 'number',
		value: ""
	},
	pdf_padding_bottom: {
		type: 'number',
		value: ""
	},
	pdf_padding_outer: {
		type: 'number',
		value: ""
	},
	pdf_white_space_placement: {
		type: 'selectlist',
		value: 'center'
	},
	markup_fold_lines: {
		type: 'checkbox',
		value: 1
	},
	fold_line_weight: {
		type: 'number',
		value: ""
	},
	markup_fold_lines_color: {
		type: 'color',
		value: '#969696'
	},
	markup_cut_lines: {
		type: 'checkbox',
		value: 1
	},
	cut_line_weight: {
		type: 'number',
		value: ""
	},
	markup_cut_lines_color: {
		type: 'color',
		value: '#666666'
	},
	markup_crosshairs: {
		type: 'checkbox',
		value: 1
	},
	markup_crosshairs_weight: {
		type: 'number',
		value: ""
	},
	markup_crosshairs_length: {
		type: 'number',
		value: ""
	},
	markup_crosshairs_color: {
		type: 'color',
		value: "#333333"
	},
	markup_spine_order: {
		type: 'checkbox',
		value: 1
	},
	markup_spine_order_weight: {
		type: 'number',
		value: ""
	},
	markup_spine_order_color: {
		type: 'color',
		value: "#b8b8b8"
	},
	markup_spine_bounds: {
		type: 'checkbox',
		value: 1
	},
	markup_spine_bounds_weight: {
		type: 'number',
		value: ""
	},
	markup_spine_bounds_length: {
		type: 'number',
		value: ""
	},
	markup_spine_bounds_color: {
		type: 'color',
		value: "#757575"
	},
	markup_spine_bounds_only_on_spine: {
		type: 'checkbox',
		value: 0
	},
	markup_sewing: {
		type: 'checkbox',
		value: 1
	},
	markup_sewing_stations: {
		type: 'selectlist',
		value: 'inner_outer'
	},
	markup_sewing_stations_color: {
		type: 'color',
		value: "#4b4b4b"
	},
	markup_sewing_dist_top: {
		type: 'number',
		value: ""
	},
	markup_sewing_dist_bottom: {
		type: 'number',
		value: ""
	},
	markup_sewing_count: {
		type: 'number',
		value: ""
	},
	markup_sewing_station_dist: {
		type: 'number',
		value: ""
	},
	markup_sewing_dot_size: {
		type: 'number',
		value: ""
	}
};


if (debug) { console.log(Object.keys(DEFAULT_VIP_SETTINGS)); };
if (debug) { console.log(DEFAULT_VIP_SETTINGS); };




/**
 * @return pull out our data from local storage (or {} if nothing is saved)
 */
function read_localStorage() {
	if (debug) { console.log("fetching from localStorage and placing in savedSettings"); };
	const savedSettingsRaw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)
	if (savedSettingsRaw == null) {
		if (debug) { console.log('no saved settings!'); };	
		return {}
	}
	const savedSettings = JSON.parse(savedSettingsRaw)
	if (debug) { console.log(savedSettings.length); };
	if (debug) { console.log(savedSettings); };
	return savedSettings;
}







function listSettings(loadResultsEl) {
	if (debug) { console.log("building load settings form"); };
	const settingsList = []
	const savedSettingsRaw = read_localStorage();

	// first get the key names (the names the user has given their saved settings)
	for (const [key, value] of Object.entries(savedSettingsRaw)) {
		settingsList[key] = JSON.parse(value);
		console.log("Pocketing '"+key+"' from local storage : ",settingsList[key])
	}
	if (debug) { console.log(settingsList); };

	// build out updated display
	const loadBtn = document.createElement("button");
	loadBtn.textContent = "Load"
	loadBtn.classList.add("disabled");
	loadBtn.id = "settings_list_load_btn"
	const deleteBtn = document.createElement("button");
	deleteBtn.textContent = "Delete"
	deleteBtn.classList.add("disabled");
	const loadSelect = document.createElement("select");
	loadSelect.className = "settings";
	loadSelect.id = "load_settings_list";
	const blankOption = document.createElement("option");
	blankOption.setAttribute("value", null);
	blankOption.innerText = " ";
	loadSelect.appendChild(blankOption);
	const toDefault = document.createElement("option");
	toDefault.setAttribute("value", LOCAL_STORAGE_DEFAULT_KEY);
	toDefault.innerText = LOCAL_STORAGE_DEFAULT_KEY;
	loadSelect.appendChild(toDefault);
	Object.keys(settingsList).forEach(settingsName => {
		const item = document.createElement("option");
		item.setAttribute("value", settingsName);
		item.innerText = settingsName;
		loadSelect.appendChild(item);
	})

	// and stuff it in the div
	loadResultsEl.innerHTML = PRE_SETTINGS_LIST_HTML
	loadResultsEl.appendChild(loadSelect);
	loadResultsEl.appendChild(loadBtn);
	loadResultsEl.appendChild(deleteBtn);

	// then assign an event handler
	loadBtn.addEventListener("click", function() {
		const settingsName = loadSelect.value
		if (settingsName == null) {
			return
		} else if (settingsName == LOCAL_STORAGE_DEFAULT_KEY) {
			changeSettings(DEFAULT_VIP_SETTINGS); //reset all settings to default
		} else {
			const newSet = settingsList[settingsName];
			if (debug) { console.log(newSet); };
			changeSettings(newSet);
		}
		loadSelect.value = ""
		loadBtn.classList.add("disabled");
	});
	deleteBtn.addEventListener("click", function() {
		const settingsName = loadSelect.value
		if (settingsName == null || settingsName == LOCAL_STORAGE_DEFAULT_KEY) {
			loadSelect.value = ""
			return
		}
		const savedImposerSettings = read_localStorage();
		delete savedImposerSettings[settingsName]
		localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(savedImposerSettings));
		listSettings(loadResultsEl)
	})
	loadSelect.addEventListener("change", function(){
		const settingsName = this.value;
		if (settingsName == null) {
			loadBtn.classList.add("disabled");
			deleteBtn.classList.add("disabled");
		} else {
			loadBtn.classList.remove("disabled");
			deleteBtn.classList.remove("disabled");
		} 
	});
}





/**
 * @param userImportedData - a list of 2 dimensional arrays [0 - key], [1 - value] 
 */
function changeSettingsBasedOnImport(userImportedData) {
	const userDataRaw = {}
	userImportedData.forEach(l => userDataRaw[l[0]] = l[1])
	const settingsSet = {} 
	for (const [key, entry] of Object.entries(DEFAULT_VIP_SETTINGS)) {
		settingsSet[key] = (userDataRaw.hasOwnProperty(key)) ? {type : entry.type, value: userDataRaw[key]} : entry
	}
	changeSettings(settingsSet)
}






function changeSettings(settingsSet) {
	const sendChange = new Event("change");
	const sendInput = new Event("input");
	const sendUpdate = new Event("update");
	if (debug) { console.log("changeSettings:"); };
	for (const [key, value] of Object.entries(settingsSet)) {
		if (debug) { console.log(`${key}: `, value); };

		if (value.type == 'radio') { // radios need to fetch by name, not id
			const radio = document.getElementsByName(key);
			
			// and they need to iterate through the collection of radio inputs with the same name to see which one is checked
			for (item of radio) {
				if (debug) { console.log(item); };
				if (item.value == value.value) {
					item.checked = true;
					if (debug) { console.log("set ", item.value , " to checked"); };
					item.dispatchEvent(sendUpdate);
					item.dispatchEvent(sendChange);
					item.dispatchEvent(sendInput);
				} else {
					item.checked = false;
				}
			}
		} else if (value.type == 'selectlist') { //selectlists are fetched by id
			if (debug) { console.log("!!selectlists!!"); };
			const sl = document.getElementById(key);
			if (debug) { console.log(sl); };
			const opts = sl.getElementsByTagName("option"); //then all their children which are option elements
			for (item of opts) { 				//are iterated through
				if (debug) { console.log(item); };
				if (item.value == value.value) {
					item.selected = true;
					if (debug) { console.log("set ", item.value , " to selected"); };
					item.dispatchEvent(sendUpdate);
					item.dispatchEvent(sendChange);
					item.dispatchEvent(sendInput);
				} else {
					item.selected = false;
				}
			}

		} else { // everything else fetches by id
			const el = document.getElementById(key);
			if (value.type == 'checkbox') {
				if (value.value == 1) {
					el.checked = true;
				} else {
					el.checked = false;
				}
			} else {
				el.value = value.value;
			}
			el.dispatchEvent(sendUpdate);
			el.dispatchEvent(sendChange);
			el.dispatchEvent(sendInput);
			if (debug) { console.log('set ', key, ' to ', value.value); };
		}
	}
}






function saveImposerSettings(settings_name, loadResultsEl) {
	if (debug) { console.log("saving the settings as '"+settings_name+"'"); };
	var newSet = {};
	for (const [key, value] of Object.entries(DEFAULT_VIP_SETTINGS)) {
		//only using the keys from defaultSettings, to know what to save
		if (value.type == 'radio') { // radios need to fetch by name, not id
			const radioSelected = document.querySelector('input[name="'+key+'"]:checked')
			if (debug) { console.log(" key ["+key+"] locking in ",radioSelected) }
			newSet[key] = { type: 'radio', value : radioSelected.id };
		}  else if (value.type == 'selectlist') { //selectlists are fetched by id
			const sl = document.getElementById(key);
			if (debug) { console.log(sl); };
			const opts = sl.getElementsByTagName("option"); //then all their children which are option elements
			for (item of opts) { 				//are iterated through
				if (debug) { console.log(item); };
				if (item.selected == true) {
					newSet[key] = { type: 'selectlist', value: item.value };
				}
			}
		} else { // everything else selects by id
			const el = document.getElementById(key);
			if (debug) { console.log(value); };
			if (value.type == 'checkbox') {
				if (el.checked == true) {
					newSet[key] = { type: 'checkbox', value: 1 };
				} else {
					newSet[key] = { type: 'checkbox', value: 0 };
				}
			} else {
				newSet[key] = { type: value.type, value: el.value };
			}
		}
	}

	if (debug) { console.log("saved settings as '"+settings_name+"'",newSet) }; 
	const savedImposerSettings = read_localStorage();
	savedImposerSettings[settings_name] = JSON.stringify(newSet);
	if (debug) { console.log(savedImposerSettings[settings_name]); };
	localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(savedImposerSettings));
	listSettings(loadResultsEl)
}
