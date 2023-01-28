import { createVariantTable, createComponentTable } from './create-table'

// TODO plugin UI
// figma.showUI(__html__, { width: 500, height: 500, title: 'Variant Table' })

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
			figma.closePlugin('Perfect!')
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
	let variantArray: object[] = []
	const booleanArray: string[] = []
	for (const [key, value] of Object.entries(
		node.componentPropertyDefinitions
	)) {
		switch (value.type) {
			case 'VARIANT':
				variantArray = [
					...variantArray,
					// use flat() to clean up array
					{ [key]: [value.variantOptions].flat() },
				]
				break
			case 'BOOLEAN':
				booleanArray.push(key)
				break
			default:
				figma.closePlugin('Not a VARIANT nor BOOLEAN')
				break
		}
	}
	// Reverse the order of BOOLEAN property to match the component property order in Figma UI
	booleanArray.reverse()
	createInstanceByProperty(variantArray, booleanArray, node)
}

// Separated createInstanceFunction from listProperty function to support different node type
// The name "createInstanceByProperty" sounds wordy, but I want to distinguish it from createInstance()
function createInstanceByProperty(
	variantArray: object[],
	booleanArray: string[],
	selectedComponentSetNode?: ComponentSetNode,
	selectedComponentNode?: ComponentNode,
	seletedInstanceNode?: InstanceNode
) {
	// Call generateBooleanArray to generate all scenario of booleans, and store in booleanMap
	if (booleanArray.length) {
		var booleanResult: object[] = generateBooleanArray(booleanArray)
	}
	// Resolve node by its type
	if (selectedComponentSetNode) {
		variantArray.forEach((variant) => {
			let instanceProperty: object = {}
			for (const [name, optionList] of Object.entries(variant)) {
				console.log('name', name)
				console.log('optionList', optionList)
				for (const option of optionList) {
					console.log('option', option)
					// Initial new instance selection array
					let instanceSelection: InstanceNode[] = []

					// Check if there is any boolean property
					// then assemble the property and create the instance
					if (booleanResult.length) {
						for (const prop of booleanResult) {
							instanceProperty = {
								[name]: option,
								...prop,
							}
							const instance =
								selectedComponentSetNode.defaultVariant.createInstance()
							instance.setProperties({ ...instanceProperty })
							instanceSelection.push(instance)
						}
					} else {
						instanceProperty = {
							[name]: option,
						}
						const instance =
							selectedComponentSetNode.defaultVariant.createInstance()
						instance.setProperties({ ...instanceProperty })
						instanceSelection.push(instance)
					}

					createVariantTable(instanceSelection)
				}
			}
		})
		createComponentTable()
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

nodeTypeCheck()
