import toposort from 'toposort';

/**
  Sorts dependencies between chunks by their "parents" attribute.
  This function sorts chunks based on their dependencies with each other.
  The parent relation between chunks as generated by Webpack for each chunk
  is used to define a directed (and hopefully acyclic) graph, which is then
  topologically sorted in order to retrieve the correct order in which
  chunks need to be embedded into HTML. A directed edge in this graph is
  describing a "is parent of" relationship from a chunk to another (distinct)
  chunk. Thus topological sorting orders chunks from bottom-layer chunks to
  highest level chunks that use the lower-level chunks.
  @param {Array} chunks an array of chunks as generated by the html-webpack-plugin.
  - For webpack < 4, It is assumed that each entry contains at least the properties
  "id" (containing the chunk id) and "parents" (array containing the ids of the
  parent chunks).
  - For webpack 4+ the see the chunkGroups param for parent-child relationships
  @param {Array} chunks an array of ChunkGroups that has a getParents method.
  Each ChunkGroup contains a list of chunks in order.
  @return {Array} A topologically sorted version of the input chunks
*/

export default {
  dependency: (chunks, chunkGroups) => {
    if (!chunks) {
      return chunks;
    }

    // We build a map (chunk-id -> chunk) for faster access during graph building.
    const nodeMap = {};

    chunks.forEach((chunk) => {
      nodeMap[chunk.id] = chunk;
    });

    // Next, we add an edge for each parent relationship into the graph
    let edges = [];

    // Add an edge for each parent (parent -> child)
    edges = chunkGroups.reduce((result, chunkGroup) => result.concat(
      Array.from(chunkGroup.parentsIterable, parentGroup => [parentGroup, chunkGroup])
    ), []);
    const sortedGroups = toposort.array(chunkGroups, edges);
    // flatten chunkGroup into chunks
    const sortedChunks = sortedGroups
      .reduce((result, chunkGroup) => result.concat(chunkGroup.chunks), [])
      .map(chunk => nodeMap[chunk.id])
      .filter((chunk, index, self) => {
        // make sure exists (ie excluded chunks not in nodeMap)
        const exists = !!chunk;
        // make sure we have a unique list
        const unique = self.indexOf(chunk) === index;
        return exists && unique;
      });
    return sortedChunks;
  },

  /**
   * Sorts the chunks based on the chunk id.
   *
   * @param  {Array} chunks the list of chunks to sort
   * @return {Array} The sorted list of chunks
   */
  id: chunks => chunks.sort((a, b) => {
    if (a.entry !== b.entry) {
      return b.entry ? 1 : -1;
    }
    return b.id - a.id;
  }),

  /**
   * Performs identity mapping (no-sort).
   * @param  {Array} chunks the chunks to sort
   * @return {Array} The sorted chunks
   */
  none: chunks => chunks,

  /**
   * Sort manually by the chunks
   * @param  {Array} chunks the chunks to sort
   * @return {Array} The sorted chunks
   */
  manual: (chunks, specifyChunks) => {
    const chunksResult = [];
    let filterResult = [];
    if (Array.isArray(specifyChunks)) {
      for (let i = 0; i < specifyChunks.length; i++) {
        filterResult = chunks.filter((chunk) => {
          if (chunk.names[0] && chunk.names[0] === specifyChunks[i]) {
            return true;
          }
          return false;
        });
        if (filterResult.length > 0) {
          chunksResult.push(filterResult[0]);
        }
      }
    }
    return chunksResult;
  },

  /**
   * Defines the default sorter.
   */
  reverse: chunks => chunks.sort((a, b) => a.id < b.id)
};
