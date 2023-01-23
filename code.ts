if (figma.currentPage.selection.length === 0) {
	figma.closePlugin('Select 1 component set first.')
} else if (figma.currentPage.selection.length > 1) {
	figma.closePlugin('Please choose just 1 component set.') // 目前只支援選擇一個 component
} else {
	listAllVariant()
}

let nodeSelection: InstanceNode[] = []
let containerSelection: FrameNode[] = []
let resultSelection: FrameNode[] = []

async function listAllVariant() {
	const currentSelection = figma.currentPage.selection[0]
	const containerPostionX = currentSelection.x
	const containerPostionY = currentSelection.y
	let variantList: object = {}
	let booleanList: string[] = []
	await figma.loadFontAsync({ family: 'Inter', style: 'Bold' })

	switch (currentSelection.type) {
		case 'COMPONENT_SET':
			const propertyList = currentSelection.componentPropertyDefinitions // TODO 處理 variant 被刪掉的 default 狀態
			for (let i = 0; Object.keys(propertyList).length > i; i++) {
				const propertyKey = Object.keys(propertyList)[i]
				if (propertyList[propertyKey].type === 'VARIANT') {
					variantList = {
						...variantList,
						[propertyKey]: propertyList[propertyKey].variantOptions,
					}
				}
				if (propertyList[propertyKey].type === 'BOOLEAN') {
					booleanList.push(propertyKey)
				}
			}
			booleanList.reverse()

			for (const [variant, optionList] of Object.entries(variantList)) {
				optionList.forEach((option: string) => {
					createVariantInstance(
						variant,
						option,
						booleanList,
						currentSelection
					)
				})
			}

			const resultContainer = figma.createFrame()
			resultContainer.name = `Variant Table - ${currentSelection.name}`
			// If there is no boolean, show the variant in a vertical aligned table
			if (booleanList.length) {
				resultContainer.layoutMode = 'HORIZONTAL'
			} else {
				resultContainer.layoutMode = 'VERTICAL'
			}
			resultContainer.primaryAxisSizingMode = 'AUTO'
			resultContainer.counterAxisSizingMode = 'AUTO'
			for (const container of containerSelection) {
				resultContainer.appendChild(container)
			}
			resultContainer.x = containerPostionX + currentSelection.width + 120
			resultContainer.y = containerPostionY
			// TODO 希望可以完全刪除 fills，目前的方式會留下隱藏的背景色。
			// Get the properties of resultContainer in an array, modify the copy then send it back
			const resultContainerFills = JSON.parse(
				JSON.stringify(resultContainer.fills)
			)
			resultContainerFills[0].visible = false
			resultContainer.fills = resultContainerFills
			resultSelection.push(resultContainer)
			figma.currentPage.selection = resultSelection
			figma.closePlugin('Done')
			break
		case 'COMPONENT':
			// TODO for componentNode
			figma.closePlugin('Please choose a component set.')
			break
		case 'INSTANCE':
			// TODO for instanceNode
			figma.closePlugin('Please choose a component set.')
			break
		default:
			figma.closePlugin('Please choose a component set.')
			break
	}
	return
}

function createVariantInstance(
	variant: string,
	option: string,
	booleanList: string[],
	selectedNode: ComponentSetNode
) {
	// Initial the property, put the variant and option inside
	let initialProperty: object = {}
	initialProperty = {
		[variant]: option,
	}

	// If there is no boolean, just create the instance
	if (booleanList.length === 0) {
		createInstance(initialProperty, selectedNode)
	}

	// If there are booleans, put each boolean into property and set to true, finally create the instance
	if (booleanList.length > 0) {
		booleanList.forEach((element) => {
			initialProperty = {
				...initialProperty,
				[element]: true,
			}
		})
		createInstance(initialProperty, selectedNode)

		// Time to toggle those booleans!
		booleanList.forEach((element) => {
			const index = booleanList.indexOf(element)
			// If the index is not the first item, I will slice a new array,
			// and push the item before index to the new array,
			// this is to make the boolean selected by index become the first item,
			// I set the index boolean to true, to prevent 'all false' condition occur, which I will deal with it later,
			// finally set the boolean to false and create an instance one at a time.
			if (index !== 0) {
				let setProperty: object = initialProperty
				const arraySlice = booleanList.slice(index)
				if (booleanList.length > 2) {
					for (let i = 0; i < index; i++) {
						arraySlice.push(booleanList[i])
					}
					// Start at 1, ensure arraySlice[0] to be 'true'
					for (let i = 1; i < arraySlice.length; i++) {
						setProperty = {
							...setProperty,
							[arraySlice[0]]: true,
							[arraySlice[i]]: false,
						}
						createInstance(setProperty, selectedNode)
					}
				}
				// If booleanList.length equal 2, meaning the above for...loop will generate duplicate result with 'index === 0',
				// So I write a conditional to solve this.
				if (booleanList.length == 2) {
					setProperty = {
						...setProperty,
						[booleanList[0]]: false,
						[element]: true,
					}
					createInstance(setProperty, selectedNode)
				}
			}

			if (index === 0) {
				let setProperty: object = initialProperty
				for (let i = 1; i < booleanList.length; i++) {
					setProperty = {
						...setProperty,
						[booleanList[0]]: true,
						[booleanList[i]]: false,
					}
					createInstance(setProperty, selectedNode)
				}
			}
		})

		// Generate 'all false' result
		let setFalse: object = initialProperty
		booleanList.forEach((element) => {
			setFalse = {
				...setFalse,
				[element]: false,
			}
		})
		createInstance(setFalse, selectedNode)
	}

	const variantContainer = figma.createFrame()
	variantContainer.name = `${variant} - ${option}`
	variantContainer.layoutMode = 'VERTICAL'
	variantContainer.primaryAxisSizingMode = 'AUTO'
	variantContainer.counterAxisSizingMode = 'AUTO'
	variantContainer.itemSpacing = 24
	variantContainer.paddingLeft = 24
	variantContainer.paddingTop = 24
	variantContainer.paddingRight = 24
	variantContainer.paddingBottom = 24
	// TODO 希望可以完全刪除 fills，目前的方式會留下隱藏的背景色。
	const variantContainerFills = JSON.parse(
		JSON.stringify(variantContainer.fills)
	)
	variantContainerFills[0].visible = false
	variantContainer.fills = variantContainerFills

	for (const node of nodeSelection) {
		variantContainer.appendChild(node)
	}
	containerSelection.push(variantContainer)
	nodeSelection = []

	// Create label for variant and option
	const variantLabel = figma.createText()
	variantLabel.fontName = { family: 'Inter', style: 'Bold' }
	variantLabel.characters = `${variant}: ${option}`
	variantLabel.fontSize = 16
	variantContainer.insertChild(0, variantLabel)
	return
}

function createInstance(prop: object, selectedNode: ComponentSetNode) {
	const newInstance = selectedNode.defaultVariant.createInstance()
	newInstance.setProperties({ ...prop })
	nodeSelection.push(newInstance)
	return
}
