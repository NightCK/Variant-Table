figma.showUI(__html__)

figma.ui.onmessage = (message) => {
  if(message === 'GO') {
    createVariantsFromComponentSet()
  }
}

function createVariantsFromComponentSet() {
  if(figma.currentPage.selection.length === 0) {
    figma.closePlugin('Select 1 component first.')
    return
  }
  if(figma.currentPage.selection.length > 1) {
    figma.closePlugin('Please choose just 1 component for now') // 目前只支援選擇一個 component
    return
  }

  const currentSelection = figma.currentPage.selection[0]
  let instancePostionX = currentSelection.x
  let instancePostionY = currentSelection.y

  if(currentSelection.type === 'COMPONENT_SET') {
    const propertyList = currentSelection.componentPropertyDefinitions // TODO 處理 variant 被刪掉的 default 狀態

    for(let i = 0; Object.keys(propertyList).length > i; i++) {
      let propertyKey = Object.keys(propertyList)[i]

      if(propertyList[propertyKey].type === 'VARIANT') {
        const variantArray = propertyList[propertyKey].variantOptions || [] // 因為 variantOptions 是 optional，要確保有 array 不然會噴錯

        for(let v = 0; variantArray.length > v; v++) {
          let newInstance = currentSelection.defaultVariant.createInstance()
          newInstance.setProperties({
            [propertyKey]: variantArray[v]
          })
          newInstance.x = instancePostionX + 200
          newInstance.y = instancePostionY
          instancePostionY += newInstance.height + 24
          console.log('List all variants!')
        }
        figma.closePlugin('Done')
        return
      }
    }
    return
  }

  // TODO 處理 instance or component
  // TODO 處理不是 instance or component 狀態
  figma.closePlugin('Please choose a component set.')
  return
}