"""
Settings API Test Suite

This tests the complete API functionality through HTTP requests.
Run with: pytest test.py -v
"""

import requests
import pytest
import json
from typing import Dict, Any
import os

# Configuration
BASE_URL = os.getenv('BASE_URL', 'http://localhost:3000')
TEST_TIMEOUT = 5  # seconds

class TestSettingsAPI:
    """Test suite for Settings API"""
    
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """
        Runs before and after each test.
        Cleans up any test data created during the test.
        """
        # Setup: Store UIDs created during test
        self.created_uids = []
        
        # Run the test
        yield
        
        # Teardown: Delete all created settings
        for uid in self.created_uids:
            try:
                requests.delete(f"{BASE_URL}/settings/{uid}", timeout=TEST_TIMEOUT)
            except:
                pass  # Ignore errors during cleanup

    def _create_setting(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper: Create a setting and track it for cleanup"""
        response = requests.post(
            f"{BASE_URL}/settings",
            json=data,
            timeout=TEST_TIMEOUT
        )
        if response.status_code == 201:
            result = response.json()
            self.created_uids.append(result['uid'])
            return result
        raise Exception(f"Failed to create setting: {response.status_code}")

    # ==================== HEALTH CHECK ====================
    
    def test_health_endpoint(self):
        """Test that the API is running"""
        response = requests.get(f"{BASE_URL}/health", timeout=TEST_TIMEOUT)
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'uptime' in data

    # ==================== CREATE (POST) ====================
    
    def test_create_setting_success(self):
        """Test creating a valid setting"""
        payload = {
            "theme": "dark",
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/settings",
            json=payload,
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify structure
        assert 'uid' in data
        assert 'theme' in data
        assert 'language' in data
        assert '_metadata' in data
        assert 'created_at' in data['_metadata']
        assert 'updated_at' in data['_metadata']
        
        # Verify values
        assert data['theme'] == "dark"
        assert data['language'] == "en"
        
        # Track for cleanup
        self.created_uids.append(data['uid'])

    def test_create_setting_complex_json(self):
        """Test creating a setting with nested JSON"""
        payload = {
            "user": {
                "name": "John",
                "preferences": {
                    "notifications": True,
                    "theme": "dark"
                }
            },
            "settings": {
                "privacy": "high",
                "language": "en"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/settings",
            json=payload,
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['user']['name'] == "John"
        assert data['user']['preferences']['notifications'] == True
        self.created_uids.append(data['uid'])

    def test_create_setting_empty_object(self):
        """Test creating a setting with empty JSON"""
        response = requests.post(
            f"{BASE_URL}/settings",
            json={},
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 400
        data = response.json()
        assert 'error' in data

    def test_create_setting_invalid_json(self):
        """Test creating a setting with invalid JSON"""
        response = requests.post(
            f"{BASE_URL}/settings",
            data="not valid json",
            headers={'Content-Type': 'application/json'},
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 400

    def test_create_setting_no_body(self):
        """Test creating a setting without a body"""
        response = requests.post(
            f"{BASE_URL}/settings",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 400

    # ==================== READ (GET) ====================
    
    def test_get_all_settings_empty(self):
        """Test getting all settings when database might have data"""
        response = requests.get(f"{BASE_URL}/settings", timeout=TEST_TIMEOUT)
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'items' in data
        assert 'pagination' in data
        assert isinstance(data['items'], list)

    def test_get_all_settings_with_data(self):
        """Test getting all settings after creating some"""
        # Create 3 test settings
        for i in range(3):
            self._create_setting({"test": i, "name": f"test_{i}"})
        
        response = requests.get(f"{BASE_URL}/settings", timeout=TEST_TIMEOUT)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least our 3 settings
        assert len(data['items']) >= 3
        assert data['pagination']['total'] >= 3

    def test_get_settings_pagination(self):
        """Test pagination parameters"""
        # Create 15 settings
        for i in range(15):
            self._create_setting({"index": i})
        
        # Get first page (limit 10)
        response = requests.get(
            f"{BASE_URL}/settings?limit=10&offset=0",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['items']) == 10
        assert data['pagination']['limit'] == 10
        assert data['pagination']['currentPage'] == 1
        
        # Get second page
        response = requests.get(
            f"{BASE_URL}/settings?limit=10&offset=10",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['pagination']['currentPage'] == 2

    def test_get_setting_by_uid_success(self):
        """Test getting a specific setting by UID"""
        # Create a setting
        created = self._create_setting({"name": "test", "value": 123})
        uid = created['uid']
        
        # Get it back
        response = requests.get(f"{BASE_URL}/settings/{uid}", timeout=TEST_TIMEOUT)
        
        assert response.status_code == 200
        data = response.json()
        assert data['uid'] == uid
        assert data['name'] == "test"
        assert data['value'] == 123

    def test_get_setting_by_uid_not_found(self):
        """Test getting a non-existent setting"""
        fake_uid = "00000000-0000-0000-0000-000000000000"
        
        response = requests.get(
            f"{BASE_URL}/settings/{fake_uid}",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 404
        data = response.json()
        assert 'error' in data

    def test_get_setting_invalid_uid_format(self):
        """Test getting a setting with invalid UID format"""
        response = requests.get(
            f"{BASE_URL}/settings/invalid-uid",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 400

    # ==================== UPDATE (PUT) ====================
    
    def test_update_setting_success(self):
        """Test updating an existing setting"""
        # Create a setting
        created = self._create_setting({"original": "value"})
        uid = created['uid']
        
        # Update it
        updated_data = {"updated": "new_value", "count": 42}
        response = requests.put(
            f"{BASE_URL}/settings/{uid}",
            json=updated_data,
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['updated'] == "new_value"
        assert data['count'] == 42
        assert 'original' not in data  # Old data replaced

    def test_update_setting_not_found(self):
        """Test updating a non-existent setting"""
        fake_uid = "00000000-0000-0000-0000-000000000000"
        
        response = requests.put(
            f"{BASE_URL}/settings/{fake_uid}",
            json={"data": "value"},
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 404

    def test_update_setting_empty_body(self):
        """Test updating with empty JSON"""
        created = self._create_setting({"data": "value"})
        
        response = requests.put(
            f"{BASE_URL}/settings/{created['uid']}",
            json={},
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 400

    def test_update_preserves_timestamps(self):
        """Test that update changes updated_at but not created_at"""
        # Create
        created = self._create_setting({"version": 1})
        original_created_at = created['_metadata']['created_at']
        
        # Wait a moment (to ensure timestamp difference)
        import time
        time.sleep(0.1)
        
        # Update
        response = requests.put(
            f"{BASE_URL}/settings/{created['uid']}",
            json={"version": 2},
            timeout=TEST_TIMEOUT
        )
        
        updated = response.json()
        assert updated['_metadata']['created_at'] == original_created_at
        assert updated['_metadata']['updated_at'] != updated['_metadata']['created_at']

    # ==================== DELETE ====================
    
    def test_delete_setting_success(self):
        """Test deleting an existing setting"""
        # Create a setting
        created = self._create_setting({"to": "delete"})
        uid = created['uid']
        
        # Delete it
        response = requests.delete(
            f"{BASE_URL}/settings/{uid}",
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = requests.get(
            f"{BASE_URL}/settings/{uid}",
            timeout=TEST_TIMEOUT
        )
        assert get_response.status_code == 404
        
        # Remove from cleanup list (already deleted)
        self.created_uids.remove(uid)

    def test_delete_setting_not_found(self):
        """Test deleting a non-existent setting (should be idempotent)"""
        fake_uid = "00000000-0000-0000-0000-000000000000"
        
        response = requests.delete(
            f"{BASE_URL}/settings/{fake_uid}",
            timeout=TEST_TIMEOUT
        )
        
        # Should still return 204 (idempotent)
        assert response.status_code == 204

    def test_delete_setting_twice(self):
        """Test deleting the same setting twice (idempotency)"""
        created = self._create_setting({"test": "double_delete"})
        uid = created['uid']
        
        # First delete
        response1 = requests.delete(
            f"{BASE_URL}/settings/{uid}",
            timeout=TEST_TIMEOUT
        )
        assert response1.status_code == 204
        
        # Second delete (should still succeed)
        response2 = requests.delete(
            f"{BASE_URL}/settings/{uid}",
            timeout=TEST_TIMEOUT
        )
        assert response2.status_code == 204
        
        self.created_uids.remove(uid)

    # ==================== EDGE CASES ====================
    
    def test_create_setting_with_special_characters(self):
        """Test creating settings with special characters"""
        payload = {
            "unicode": "Hello 世界 🌍",
            "quotes": 'He said "hello"',
            "newlines": "Line 1\nLine 2",
            "special": "!@#$%^&*()"
        }
        
        response = requests.post(
            f"{BASE_URL}/settings",
            json=payload,
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['unicode'] == "Hello 世界 🌍"
        self.created_uids.append(data['uid'])

    def test_create_setting_with_numbers_and_booleans(self):
        """Test various JSON data types"""
        payload = {
            "integer": 42,
            "float": 3.14159,
            "boolean_true": True,
            "boolean_false": False,
            "null_value": None,
            "array": [1, 2, 3],
            "nested": {"key": "value"}
        }
        
        response = requests.post(
            f"{BASE_URL}/settings",
            json=payload,
            timeout=TEST_TIMEOUT
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['integer'] == 42
        assert data['boolean_true'] is True
        assert data['null_value'] is None
        self.created_uids.append(data['uid'])

    def test_concurrent_operations(self):
        """Test that concurrent creates work correctly"""
        import concurrent.futures
        
        def create_setting(index):
            return requests.post(
                f"{BASE_URL}/settings",
                json={"index": index},
                timeout=TEST_TIMEOUT
            )
        
        # Create 10 settings concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_setting, i) for i in range(10)]
            responses = [f.result() for f in futures]
        
        # All should succeed
        for response in responses:
            assert response.status_code == 201
            self.created_uids.append(response.json()['uid'])

    # ==================== PERFORMANCE ====================
    
    def test_response_time_create(self):
        """Test that create operation is reasonably fast"""
        import time
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/settings",
            json={"performance": "test"},
            timeout=TEST_TIMEOUT
        )
        duration = time.time() - start
        
        assert response.status_code == 201
        assert duration < 1.0  # Should complete in under 1 second
        self.created_uids.append(response.json()['uid'])

    def test_response_time_list(self):
        """Test that list operation is reasonably fast"""
        import time
        
        start = time.time()
        response = requests.get(f"{BASE_URL}/settings", timeout=TEST_TIMEOUT)
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 1.0  # Should complete in under 1 second


# ==================== RUN CONFIGURATION ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
