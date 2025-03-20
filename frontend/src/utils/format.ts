export const formatSearchResult = (result: any) => {
  const text = result.metadata.text
  const title = result.metadata.title || 'No title'
  const source = result.metadata.source
  
  return `${text}\n\nTitle: ${title}\nSource: ${source}`
} 