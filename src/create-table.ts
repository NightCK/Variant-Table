let variantTableSelection: FrameNode[] = []

function createVariantTable(selection: InstanceNode[]) {
	// Create a table for the variant option
	const optionContainer: FrameNode = figma.createFrame()
	optionContainer.layoutMode = 'VERTICAL'
	optionContainer.primaryAxisSizingMode = 'AUTO'
	optionContainer.counterAxisSizingMode = 'AUTO'
	optionContainer.paddingLeft = 24
	optionContainer.paddingTop = 24
	optionContainer.paddingRight = 24
	optionContainer.paddingBottom = 24
	optionContainer.itemSpacing = 24
	for (const instance of selection) {
		optionContainer.appendChild(instance)
	}
	variantTableSelection.push(optionContainer)
	return
}

function createComponentTable() {
	const componentTable: FrameNode = figma.createFrame()
	componentTable.layoutMode = 'HORIZONTAL'
	componentTable.primaryAxisSizingMode = 'AUTO'
	componentTable.counterAxisSizingMode = 'AUTO'
	componentTable.itemSpacing = 0
	for (const table of variantTableSelection) {
		componentTable.appendChild(table)
	}
	return
}

export { createVariantTable, createComponentTable }
