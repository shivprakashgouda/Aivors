/**
 * Get records filtered by EMAIL (user email)
 *
 * @param {string} email - The user email to filter by
 * @param {object} options - Additional query options (offset, maxRecords, etc.)
 * @returns {Promise<object>} - Object containing records array and offset
 */
async function getRecordsByEmail(email, options = {}) {
  console.log(`📧 Fetching Airtable records for email: ${email}`);

  // Build Airtable formula to filter by EMAIL
  // Formula format: {EMAIL} = 'user@example.com'
  const filterFormula = `{EMAIL} = '${email}'`;

  // Merge the filter formula with any additional options
  return getAirtableRecords({
    ...options,
    filterByFormula: filterFormula,
  });
}

/**
 * Get all records for a user by email with automatic pagination
 *
 * @param {string} email - The user email to filter by
 * @param {number} maxRecords - Optional maximum total records to fetch
 * @returns {Promise<array>} - Array of all records
 */
async function getAllRecordsByEmail(email, maxRecords = null) {
  console.log(`📚 Fetching ALL Airtable records for email: ${email}`);

  let allRecords = [];
  let offset = null;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`   → Fetching page ${pageCount}...`);

    // Fetch next page
    const result = await getRecordsByEmail(email, { offset });
    allRecords = allRecords.concat(result.records);
    offset = result.offset;

    // Stop if we've reached the max records limit
    if (maxRecords && allRecords.length >= maxRecords) {
      allRecords = allRecords.slice(0, maxRecords);
      break;
    }

  } while (offset);

  console.log(`✅ Fetched total of ${allRecords.length} records across ${pageCount} pages`);

  return allRecords;
}
/**
 * Airtable Service Module
 * 
 * Handles all interactions with Airtable API
 * - Uses Personal Access Token (PAT) authentication from environment variables
 * - Supports pagination via offset parameter
 * - Implements filterByFormula for querying records
 * 
 * SECURITY NOTE: Never hardcode the PAT token. Always use process.env.AIRTABLE_TOKEN
 */

const https = require('https');

/**
 * Airtable Configuration
 * All credentials loaded from environment variables
 */
const AIRTABLE_CONFIG = {
  baseId: process.env.AIRTABLE_BASE,
  tableName: process.env.AIRTABLE_TABLE,
  viewName: process.env.AIRTABLE_VIEW,
  token: process.env.AIRTABLE_TOKEN, // Personal Access Token (PAT)
};

/**
 * Make authenticated request to Airtable API
 * 
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object|null} body - Request body for POST/PATCH requests
 * @returns {Promise<object>} - Parsed JSON response
 */
function makeAirtableRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    // Validate that token is available
    if (!AIRTABLE_CONFIG.token) {
      return reject(new Error('AIRTABLE_TOKEN is not configured in environment variables'));
    }

    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.token}`, // PAT authentication
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          // Check for Airtable API errors
          if (res.statusCode >= 400) {
            console.error('❌ Airtable API Error:', parsed);
            return reject(new Error(parsed.error?.message || `Airtable API error: ${res.statusCode}`));
          }
          
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse Airtable response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Airtable request failed:', error);
      reject(error);
    });

    // Send body for POST/PATCH requests
    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Get records from Airtable with optional filtering and pagination
 * 
 * This is the main reusable function for fetching Airtable data
 * 
 * @param {object} options - Query options
 * @param {string} options.filterByFormula - Airtable formula to filter records
 * @param {string} options.view - View name to use (defaults to config view)
 * @param {string} options.offset - Pagination offset token from previous response
 * @param {number} options.maxRecords - Maximum number of records to return
 * @param {string[]} options.fields - Specific fields to return
 * @returns {Promise<object>} - Object containing records array and offset for pagination
 */
async function getAirtableRecords(options = {}) {
  try {
    console.log('📊 Fetching Airtable records with options:', JSON.stringify(options, null, 2));

    // Validate required configuration
    if (!AIRTABLE_CONFIG.baseId) {
      throw new Error('AIRTABLE_BASE is not configured');
    }
    if (!AIRTABLE_CONFIG.tableName) {
      throw new Error('AIRTABLE_TABLE is not configured');
    }

    // Build query parameters
    const params = new URLSearchParams();

    // Add view parameter (use provided view or default from config)
    const viewName = options.view || AIRTABLE_CONFIG.viewName;
    if (viewName) {
      params.append('view', viewName);
    }

    // Add filter formula if provided
    if (options.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }

    // Add pagination offset if provided
    if (options.offset) {
      params.append('offset', options.offset);
    }

    // Add maxRecords if provided
    if (options.maxRecords) {
      params.append('maxRecords', options.maxRecords);
    }

    // Add specific fields if provided
    if (options.fields && Array.isArray(options.fields)) {
      options.fields.forEach(field => {
        params.append('fields[]', field);
      });
    }

    // Construct API endpoint path
    // URL encode the table name to handle spaces and special characters
    const encodedTableName = encodeURIComponent(AIRTABLE_CONFIG.tableName);
    const path = `/v0/${AIRTABLE_CONFIG.baseId}/${encodedTableName}?${params.toString()}`;

    console.log(`📡 Airtable API Request: GET ${path}`);

    // Make the request
    const response = await makeAirtableRequest(path, 'GET');

    console.log(`✅ Retrieved ${response.records?.length || 0} records from Airtable`);

    // Return records and offset for pagination
    return {
      records: response.records || [],
      offset: response.offset || null, // Offset token for next page (null if no more pages)
    };

  } catch (error) {
    console.error('❌ Error fetching Airtable records:', error);
    throw error;
  }
}

/**
 * Get records filtered by owner_id (userId)
 * 
 * This is a convenience function for the common use case of fetching
 * records for a specific user
 * 
 * @param {string} userId - The user ID to filter by
 * @param {object} options - Additional query options (offset, maxRecords, etc.)
 * @returns {Promise<object>} - Object containing records array and offset
 */
async function getRecordsByUserId(userId, options = {}) {
  console.log(`👤 Fetching Airtable records for user: ${userId}`);

  // Build Airtable formula to filter by owner_id
  // Formula format: {owner_id} = 'userId'
  const filterFormula = `{owner_id} = '${userId}'`;

  // Merge the filter formula with any additional options
  return getAirtableRecords({
    ...options,
    filterByFormula: filterFormula,
  });
}

/**
 * Get all records for a user with automatic pagination
 * 
 * This function automatically handles pagination and returns ALL records
 * for the specified user, not just the first page
 * 
 * @param {string} userId - The user ID to filter by
 * @param {number} maxRecords - Optional maximum total records to fetch
 * @returns {Promise<array>} - Array of all records
 */
async function getAllRecordsByUserId(userId, maxRecords = null) {
  console.log(`📚 Fetching ALL Airtable records for user: ${userId}`);

  let allRecords = [];
  let offset = null;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`   → Fetching page ${pageCount}...`);

    // Fetch next page
    const result = await getRecordsByUserId(userId, { offset });
    
    allRecords = allRecords.concat(result.records);
    offset = result.offset;

    // Stop if we've reached the max records limit
    if (maxRecords && allRecords.length >= maxRecords) {
      allRecords = allRecords.slice(0, maxRecords);
      break;
    }

  } while (offset); // Continue while there's a next page

  console.log(`✅ Fetched total of ${allRecords.length} records across ${pageCount} pages`);

  return allRecords;
}

module.exports = {
  getAirtableRecords,
  getRecordsByUserId,
  getAllRecordsByUserId,
  getRecordsByEmail,
  getAllRecordsByEmail,
  AIRTABLE_CONFIG, // Export config for validation/debugging
};
