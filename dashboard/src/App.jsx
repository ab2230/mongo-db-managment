import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API = 'http://localhost:3001';

function App() {
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [newDoc, setNewDoc] = useState('{}');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('{}');
  
  // Filter states
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterOperator, setFilterOperator] = useState('equals');
  const [availableFields, setAvailableFields] = useState([]);
  
  // Loading states
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [loadingDrop, setLoadingDrop] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await axios.get(`${API}/collections`);
      setCollections(res.data);
    } catch (error) {
      alert('Error fetching collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Extract unique fields from data
  const extractFields = (dataArray) => {
    const fields = new Set();
    dataArray.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (key !== '_id') { // Exclude _id from filter options
          fields.add(key);
        }
      });
    });
    return Array.from(fields).sort();
  };

  // Apply filters to data
  const applyFilter = (dataArray, field, value, operator) => {
    if (!field || !value) return dataArray;

    return dataArray.filter(doc => {
      const docValue = doc[field];
      if (docValue === undefined || docValue === null) return false;

      const docValueStr = String(docValue).toLowerCase();
      const filterValueStr = String(value).toLowerCase();

      switch (operator) {
        case 'equals':
          return docValueStr === filterValueStr;
        case 'contains':
          return docValueStr.includes(filterValueStr);
        case 'startsWith':
          return docValueStr.startsWith(filterValueStr);
        case 'endsWith':
          return docValueStr.endsWith(filterValueStr);
        case 'greaterThan':
          return Number(docValue) > Number(value);
        case 'lessThan':
          return Number(docValue) < Number(value);
        default:
          return true;
      }
    });
  };

  // Update filtered data when filters change
  useEffect(() => {
    const filtered = applyFilter(data, filterField, filterValue, filterOperator);
    setFilteredData(filtered);
  }, [data, filterField, filterValue, filterOperator]);

  const loadData = async (name) => {
    setSelected(name);
    setLoadingData(true);
    // Reset filters when switching collections
    setFilterField('');
    setFilterValue('');
    setFilterOperator('equals');
    
    try {
      const res = await axios.get(`${API}/data/${name}`);
      setData(res.data);
      setFilteredData(res.data);
      
      // Extract available fields for filtering
      const fields = extractFields(res.data);
      setAvailableFields(fields);
    } catch (error) {
      alert('Error loading data');
    } finally {
      setLoadingData(false);
    }
  };

  const refetchData = () => {
    if (selected) {
      loadData(selected);
    }
  };

  const clearFilters = () => {
    setFilterField('');
    setFilterValue('');
    setFilterOperator('equals');
  };

  const addDocument = async () => {
    setLoadingAdd(true);
    try {
      const parsed = JSON.parse(newDoc);
      await axios.post(`${API}/data/${selected}`, parsed);
      await loadData(selected);
      setNewDoc('{}');
    } catch (error) {
      alert('Invalid JSON or server error');
    } finally {
      setLoadingAdd(false);
    }
  };

  const deleteDoc = async (id) => {
    setLoadingDelete(id);
    try {
      await axios.delete(`${API}/data/${selected}/${id}`);
      await loadData(selected);
    } catch (error) {
      alert('Error deleting document');
    } finally {
      setLoadingDelete(null);
    }
  };

  const dropCollection = async () => {
    setLoadingDrop(true);
    try {
      await axios.delete(`${API}/collection/${selected}`);
      setSelected(null);
      setData([]);
      setFilteredData([]);
      await fetchCollections();
    } catch (error) {
      alert('Error dropping collection');
    } finally {
      setLoadingDrop(false);
    }
  };

  const saveEdit = async (id) => {
    setLoadingEdit(true);
    try {
      const parsed = JSON.parse(editValue);
      await axios.put(`${API}/data/${selected}/${id}`, parsed);
      await loadData(selected);
      setEditingId(null);
    } catch (error) {
      alert('Invalid JSON format or server error');
    } finally {
      setLoadingEdit(false);
    }
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export.');
      return;
    }

    // Sanitize data for Excel export
    const dataToExport = filteredData.map(doc => {
      const newDoc = {};
      for (const key in doc) {
        if (typeof doc[key] === 'object' && doc[key] !== null) {
          newDoc[key] = JSON.stringify(doc[key]);
        } else {
          newDoc[key] = doc[key];
        }
      }
      return newDoc;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selected || 'Sheet1');
    XLSX.writeFile(workbook, `${selected || 'export'}.xlsx`);
  };

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">MongoDB Dashboard</h1>
      <div className="flex gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold">Collections</h2>
            <button
              className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={fetchCollections}
              disabled={loadingCollections}
            >
              {loadingCollections ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                '↻'
              )}
            </button>
          </div>
          <ul className="bg-gray-100 p-2 rounded w-40">
            {loadingCollections ? (
              <li className="flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </li>
            ) : (
              collections.map(name => (
                <li key={name} className="cursor-pointer hover:bg-gray-300 p-1 rounded"
                    onClick={() => loadData(name)}>
                  {name}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex-1">
          {selected && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl">{selected}</h2>
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                  <span className="font-semibold">
                    {filteredData.length}
                  </span>
                  {filteredData.length !== data.length && (
                    <span className="text-gray-600"> of {data.length}</span>
                  )}
                  <span className="text-gray-600"> documents</span>
                </div>
                <button
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={refetchData}
                  disabled={loadingData}
                >
                  {loadingData ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    'Refetch Data'
                  )}
                </button>
              </div>

              {/* Filter Section */}
              {availableFields.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                  <h3 className="font-semibold mb-3 text-gray-700">Filter Documents</h3>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Field</label>
                      <select
                        className="border rounded px-3 py-2 text-sm min-w-32"
                        value={filterField}
                        onChange={(e) => setFilterField(e.target.value)}
                      >
                        <option value="">Select field...</option>
                        {availableFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Operator</label>
                      <select
                        className="border rounded px-3 py-2 text-sm min-w-32"
                        value={filterOperator}
                        onChange={(e) => setFilterOperator(e.target.value)}
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="startsWith">Starts with</option>
                        <option value="endsWith">Ends with</option>
                        <option value="greaterThan">Greater than</option>
                        <option value="lessThan">Less than</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">Value</label>
                      <input
                        type="text"
                        className="border rounded px-3 py-2 text-sm min-w-48"
                        placeholder="Enter filter value..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                      />
                    </div>
                    
                    <button
                      className="bg-gray-400 text-white px-3 py-2 text-sm rounded hover:bg-gray-500"
                      onClick={clearFilters}
                    >
                      Clear
                    </button>
                  </div>
                  
                  {(filterField && filterValue) && (
                    <div className="mt-3 text-sm text-gray-600">
                      Active filter: <span className="font-mono bg-white px-2 py-1 rounded">
                        {filterField} {filterOperator} "{filterValue}"
                      </span>
                    </div>
                  )}
                </div>
              )}

              <textarea
                className="w-full border p-2 mb-2 h-24 rounded"
                value={newDoc}
                onChange={e => setNewDoc(e.target.value)}
                placeholder="Enter JSON document..."
              />
              
              <div className="mb-4">
                <button 
                  className="bg-green-500 text-white px-4 py-2 mr-2 rounded hover:bg-green-600 disabled:opacity-50"
                  onClick={addDocument}
                  disabled={loadingAdd}
                >
                  {loadingAdd ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add Document'
                  )}
                </button>
                
                <button 
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                  onClick={dropCollection}
                  disabled={loadingDrop}
                >
                  {loadingDrop ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Dropping...
                    </div>
                  ) : (
                    'Drop Collection'
                  )}
                </button>

                <button 
                  className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 disabled:opacity-50"
                  onClick={exportToExcel}
                  disabled={filteredData.length === 0}
                >
                  Export to Excel
                </button>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg">Loading data...</span>
                  </div>
                </div>
              ) : (
                <table className="table-auto w-full mt-4 border rounded">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-2">ID</th>
                      <th className="border px-2 py-2">Data</th>
                      <th className="border px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(d => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="border px-2 py-2 font-mono text-xs">{d._id}</td>
                        <td className="border px-2 py-2 text-sm whitespace-pre-wrap">
                          {editingId === d._id ? (
                            <textarea
                              className="w-full border p-1 text-xs rounded"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              rows={4}
                            />
                          ) : (
                            JSON.stringify(d, null, 2)
                          )}
                        </td>
                        <td className="border px-2 py-2">
                          {editingId === d._id ? (
                            <>
                              <button
                                className="bg-blue-500 text-white px-2 py-1 mr-2 text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                                onClick={() => saveEdit(d._id)}
                                disabled={loadingEdit}
                              >
                                {loadingEdit ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                  </div>
                                ) : (
                                  'Save'
                                )}
                              </button>
                              <button
                                className="bg-gray-400 text-white px-2 py-1 text-xs rounded hover:bg-gray-500"
                                onClick={() => setEditingId(null)}
                                disabled={loadingEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="bg-yellow-500 text-white px-2 py-1 mr-2 text-xs rounded hover:bg-yellow-600"
                                onClick={() => {
                                  setEditingId(d._id);
                                  setEditValue(JSON.stringify(d, null, 2));
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-400 text-white px-2 py-1 text-xs rounded hover:bg-red-500 disabled:opacity-50"
                                onClick={() => deleteDoc(d._id)}
                                disabled={loadingDelete === d._id}
                              >
                                {loadingDelete === d._id ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  'Delete'
                                )}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Show message when no results found */}
              {!loadingData && filteredData.length === 0 && data.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents match the current filter.</p>
                  <button
                    className="mt-2 text-blue-500 hover:text-blue-700 underline"
                    onClick={clearFilters}
                  >
                    Clear filters to show all documents
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
