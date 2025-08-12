# Change Log

## 2025-08-11: Event-Program Association Enhancement

### Problem Identified
- Data inconsistency between admin panel and mobile app program listings
- Admin panel's "Add Program" dialog lacked event selection functionality
- Programs were automatically assigned to "active" event without explicit selection
- Different parts of the system used different logic to determine the "active" event

### Root Cause Analysis
- When adding programs in admin panel, there was no way to select which event the program belonged to
- System was automatically assigning programs to the "active" event, but different components had different definitions of "active"
- Mobile users login with event codes, but admin panel didn't respect event boundaries

### Solution Implemented

#### Backend API Changes

1. **Enhanced GET /api/admin/programs endpoint**:
   - Added support for `event_id` query parameter
   - When `event_id` is provided: `WHERE p.event_id = $1`
   - When not provided: Falls back to current active event
   - Location: `backend/src/controllers/adminController.js:809-851`

2. **Enhanced POST /api/admin/programs endpoint**:
   - Added support for `event_id` in request body
   - Validates specified event exists before creating program
   - Falls back to active event if no event_id provided
   - Location: `backend/src/controllers/adminController.js:853-922`

3. **Existing GET /api/admin/events endpoint**:
   - Already functional, returns all events with program/vote counts
   - Location: `backend/src/controllers/adminController.js:554-584`

#### Frontend Changes

4. **Admin Panel Programs View**:
   - Added event selection card at top of page
   - Shows current selected event with status and statistics
   - Event dropdown shows event name and code
   - Location: `frontend/admin/src/views/Programs.vue:5-36`

5. **Add/Edit Program Dialog Enhancement**:
   - Added "所属活动" (Event) field as first form item
   - Event selection is required for new programs
   - Event selection disabled when editing existing programs
   - Pre-selects currently selected event for new programs
   - Location: `frontend/admin/src/views/Programs.vue:149-163`

6. **Vuex Store Updates**:
   - Added events state management
   - Enhanced fetchPrograms action to support eventId parameter
   - Added fetchEvents action
   - Location: `frontend/admin/src/store/modules/admin.js:131-158`

7. **API Layer Updates**:
   - Enhanced getPrograms() to accept eventId parameter
   - Already had getEvents() method
   - Location: `frontend/admin/src/api/admin.js:30-55`

### Technical Implementation Details

#### Database Schema
- Programs table has `event_id` foreign key referencing events table
- Proper indexes exist for efficient querying
- Location: `database/schema.sql:45-63`

#### API Endpoints Tested
- GET /api/admin/events ✅ - Returns all events with statistics
- GET /api/admin/programs?event_id=2 ✅ - Returns programs for specific event
- GET /api/admin/programs?event_id=3 ✅ - Returns programs for different event
- POST /api/admin/programs ✅ - Creates program with specified event_id

#### Test Results
- Event 2 (PWB111): Contains 3 programs including test programs
- Event 3 (PWB222): Contains 4 programs 
- Event 1 (ANNIV2025): Contains 9 programs
- Program creation with event_id parameter working correctly
- Event filtering working correctly for both read and write operations

### Docker Container Issues Resolved
- Initial Docker build was not picking up latest code changes
- Container rebuild with --no-cache was required multiple times
- Applied runtime patches to test functionality before final rebuild
- All services now running with correct code versions

### Testing Verification
- Admin panel (http://localhost:8082) ✅ Accessible
- Mobile app (http://localhost:8080) ✅ Accessible  
- Backend API (http://localhost:3000) ✅ All admin endpoints working
- Database queries ✅ Proper event filtering implemented
- Data consistency ✅ Programs correctly associated with events

### Security Notes
- Admin endpoints properly protected with X-Admin-Token header
- No sensitive information exposed in frontend
- Proper input validation for event_id parameters
- SQL injection protection through parameterized queries

### Files Modified
1. `backend/src/controllers/adminController.js` - Enhanced getPrograms() and createProgram() methods
2. `frontend/admin/src/views/Programs.vue` - Added event selection UI
3. `frontend/admin/src/store/modules/admin.js` - Enhanced state management  
4. `frontend/admin/src/api/admin.js` - Already had required methods

### Migration Notes
- No database schema changes required
- Existing programs remain associated with their events
- Backward compatibility maintained for APIs without event_id parameter
- Admin users now have explicit control over program-event associations

### System Architecture Impact
- Resolves data inconsistency between admin panel and mobile app
- Enables proper multi-event support
- Maintains separation between different events' programs
- Provides clear event context in admin interface

### Performance Impact
- Minimal performance impact
- Database queries remain efficient with existing indexes
- Event list loaded once per session
- Program filtering happens at database level

### Future Considerations
- Consider adding event switching without page reload
- Potential for bulk program operations across events
- Enhanced event management features (status changes, etc.)
- Event-based access control for different admin users