figma.showUI(__html__)

figma.ui.onmessage = (message) => {
  if(message === 'GO') {
    listAllProperty()
  }
}

function listAllProperty() {
  var variantList:string[] = []
  var booleanList:string[] = []

  if(figma.currentPage.selection.length === 0) {
    figma.closePlugin('Select 1 component first.')
    return
  }
  if(figma.currentPage.selection.length > 1) {
    figma.closePlugin('Please choose just 1 component')
    return
  }

  const currentSelection = figma.currentPage.selection[0]

  if(currentSelection.type === 'COMPONENT_SET') {
    const propertyList = currentSelection.componentPropertyDefinitions // TODO 處理 variant 被刪掉的 default 狀態

    for(let i = 0; Object.keys(propertyList).length > i; i++) {
      let propertyKey = Object.keys(propertyList)[i]

      if(propertyList[propertyKey].type === 'VARIANT') {
        let variantArray = propertyList[propertyKey].variantOptions || [] // 因為 variantOptions 是 optional，要確保有 array 不然會噴錯
        variantList = [...variantArray]
        console.log('variantList', variantList)
      }

      if(propertyList[propertyKey].type === 'BOOLEAN') {
        booleanList = [propertyKey]
        console.log('booleanList', booleanList)
      }
    }

    createAllProperty(variantList, booleanList)
    return
  }

  // TODO 處理 instance or component
  // TODO 處理不是 instance or component 狀態
  figma.closePlugin('Please choose a component set.')
  return
}

function createAllProperty(variantList:string[], booleanList:string[]) {
  console.log('createAllProperty')
}