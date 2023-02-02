import { createVariantTable, createComponentTable } from './create-table'

// TODO plugin UI
// figma.showUI(__html__, { width: 500, height: 500, title: 'Variant Table' })

// Initialize new instance selection array
var instanceSelection: InstanceNode[] = []

// 有趣的錯誤，如果在這邊沒有用到 return，程式繼續跑到下面檢查 type 的地方會報錯：
// TypeError: Cannot read properties of undefined (reading 'type')
function nodeTypeCheck() {
	const currentSelection = figma.currentPage.selection
	if (currentSelection.length === 0) {
		figma.closePlugin('Please select a component')
		return
	} else if (currentSelection.length > 1) {
		figma.closePlugin('Please select just one component')
		return
	}

	switch (currentSelection[0].type) {
		case 'COMPONENT_SET':
			listPropertyFromComponentSet(currentSelection[0])
			break
		case 'COMPONENT':
			figma.closePlugin('COMPONENT')
			break
		case 'INSTANCE':
			figma.closePlugin('INSTANCE')
		default:
			figma.closePlugin('Please select a component')
			break
	}
}

function listPropertyFromComponentSet(node: ComponentSetNode) {
	// Sort property by type, filter out property and variantOptions and push them into designated array
	let anchorVariant: object = {}
	let variantArray: object[] = []
	const booleanArray: string[] = []
	for (const [key, value] of Object.entries(node.componentPropertyDefinitions)) {
		switch (value.type) {
			case 'VARIANT':
				// The first variant will be set as anchor
				if (Object.keys(anchorVariant).length === 0) {
					anchorVariant = {
						[key]: value.variantOptions,
					}
				} else {
					variantArray = [...variantArray, { [key]: value.variantOptions }]
				}
				break
			case 'BOOLEAN':
				booleanArray.push(key)
				break
		}
	}
	// Reverse the order of BOOLEAN property to match the component property order in Figma UI
	booleanArray.reverse()
	assembleProperty(anchorVariant, variantArray, booleanArray, node)
}

// Separated createInstanceFunction from listProperty function to support different node type
// The name "createInstanceByProperty" sounds wordy, but I want to distinguish it from createInstance()
function assembleProperty(
	anchorVariant: object,
	variantArray: object[],
	booleanArray: string[],
	selectedComponentSetNode?: ComponentSetNode,
	selectedComponentNode?: ComponentNode,
	seletedInstanceNode?: InstanceNode
) {
	// Call generateBooleanArray to generate all scenario of booleans, and store in booleanMap
	// Resolve node by its type
	if (selectedComponentSetNode) {
		var booleanResult: object[] = generateBooleanArray(booleanArray)
		let instanceProperty: object = {}
		if (Object.keys(anchorVariant).length) {
			console.log(Object.keys(anchorVariant).length)
			for (const [anchorName, anchorOptionList] of Object.entries(anchorVariant)) {
				anchorOptionList.forEach((anchorOption: string) => {
					// Initialize instanceProperty
					instanceProperty = {
						[anchorName]: anchorOption,
					}

					if (variantArray.length) {
						variantArray.forEach((variant) => {
							for (const [name, optionList] of Object.entries(variant)) {
								for (const option of optionList) {
									instanceProperty = {
										...instanceProperty,
										[name]: option,
									}
									// Check if there is any boolean property
									if (booleanArray.length) {
										for (const result of booleanResult) {
											instanceProperty = {
												...instanceProperty,
												...result,
											}
											createInstance(
												selectedComponentSetNode,
												instanceProperty
											)
										}
										// Clear the selection for next variant
										console.log('1', instanceSelection)
										createVariantTable(instanceSelection)
										instanceSelection = []
									} else {
										createInstance(selectedComponentSetNode, instanceProperty)
									}
								}
							}
						})
					} else {
						if (booleanArray.length) {
							for (const result of booleanResult) {
								instanceProperty = {
									...instanceProperty,
									...result,
								}
								createInstance(selectedComponentSetNode, instanceProperty)
							}
							// Clear the selection for next variant
							console.log('Only Boolean', instanceSelection)
							createVariantTable(instanceSelection)
							instanceSelection = []
						} else {
							createInstance(selectedComponentSetNode, instanceProperty)
						}
					}
				})
			}
		} else if (booleanArray.length) {
			for (const result of booleanResult) {
				instanceProperty = {
					...instanceProperty,
					...result,
				}
				createInstance(selectedComponentSetNode, instanceProperty)
			}
		} else {
			figma.closePlugin('No property found 🤯')
			return
		}
		createComponentTable()
		figma.closePlugin('Done!')
	}
	if (selectedComponentNode) {
		// TODO
	}
	if (seletedInstanceNode) {
		// TODO
	}
}

function generateBooleanArray(booleanArray: string[]) {
	let booleanResult: object[] = []
	let allTrueProperty: object = {}
	let allFalseProperty: object = {}

	// Intialize all true scenario object
	booleanArray.forEach((bool) => {
		allTrueProperty = {
			...allTrueProperty,
			[bool]: true,
		}
	})
	booleanResult.push(allTrueProperty)

	// Intialize all false scenario object,
	// but push this array in the end of the function, to make sure the order is correct
	booleanArray.forEach((bool) => {
		allFalseProperty = {
			...allFalseProperty,
			[bool]: false,
		}
	})

	// Generate all kinds of boolean scenarios
	booleanArray.forEach((anchor) => {
		// Note the location of the anchor
		const index = booleanArray.indexOf(anchor)
		// use slice() to create a new array
		const arraySlice = booleanArray.slice(index)
		// Resemble the array, the index item become the first item in this new array
		for (let i = 0; i < index; i++) {
			arraySlice.push(booleanArray[i])
		}
		let setToTrueProperty = allTrueProperty

		for (const bool of arraySlice) {
			if (bool !== anchor) {
				setToTrueProperty = {
					...setToTrueProperty,
					[bool]: false,
				}
				booleanResult.push(setToTrueProperty)
			}
		}
	})

	booleanResult.push(allFalseProperty)
	return booleanResult
}

function createInstance(node: ComponentSetNode, property: object) {
	const instance = node.defaultVariant.createInstance()
	instance.setProperties({
		...property,
	})
	instanceSelection.push(instance)
}

nodeTypeCheck()
