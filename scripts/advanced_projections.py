#!/usr/bin/env python3
"""
Advanced Projection Calculator with Statistical Analysis
Uses 2025 baseline data + new routes for comprehensive 2026 projections
"""

import sys
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import statistics
import math

class AdvancedProjectionCalculator:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        
    def calculate(self, projection_year: int, routes: List[Dict[str, Any]], baseline_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Calculate advanced projections with statistical analysis.
        
        Args:
            projection_year: Year to project for (e.g., 2026)
            routes: List of route configurations (new routes + modifications)
            baseline_data: Historical 2025 data for baseline routes
        """
        
        # Combine baseline routes with new routes
        all_routes = self._merge_baseline_and_new_routes(routes, baseline_data)
        
        # Calculate projections
        yearly = self._calculate_yearly_advanced(all_routes, projection_year)
        quarterly = self._calculate_quarterly_advanced(all_routes, projection_year)
        monthly = self._calculate_monthly_advanced(all_routes, projection_year)
        seasonal = self._calculate_seasonal_advanced(all_routes, projection_year)
        route_breakdown = self._calculate_route_breakdown_advanced(all_routes, yearly['totalOperations'])
        
        # Statistical analysis
        statistics_analysis = self._calculate_statistics(all_routes, projection_year)
        
        # Scenario analysis (optimistic, pessimistic, realistic)
        scenarios = self._calculate_scenarios(all_routes, projection_year)
        
        return {
            'projectionYear': projection_year,
            'yearly': yearly,
            'quarterly': quarterly,
            'monthly': monthly,
            'seasonal': seasonal,
            'routeBreakdown': route_breakdown,
            'statistics': statistics_analysis,
            'scenarios': scenarios,
            'metadata': {
                'calculatedAt': datetime.now().isoformat(),
                'totalRoutes': len(all_routes),
                'baselineRoutes': len([r for r in all_routes if r.get('isBaseline', False)]),
                'newRoutes': len([r for r in all_routes if not r.get('isBaseline', False)]),
            }
        }
    
    def _merge_baseline_and_new_routes(self, new_routes: List[Dict], baseline_data: Optional[Dict]) -> List[Dict]:
        """Merge baseline 2025 routes with new 2026 routes."""
        merged = []
        baseline_route_keys = set()
        
        # Add baseline routes from 2025 data
        if baseline_data and baseline_data.get('routeSummary'):
            for route in baseline_data['routeSummary']:
                # Create unique key for route
                route_key = f"{route['destination']}-{route['airlineIcao']}-{route['aircraftType']}"
                baseline_route_keys.add(route_key)
                
                merged.append({
                    'id': f"baseline-{route['route']}-{route['airlineIcao']}",
                    'destination': route['destination'],
                    'route': route['route'],
                    'airlineIcao': route['airlineIcao'],
                    'aircraftType': route['aircraftType'],
                    'weeklyOperations': max(1, round(route['weeklyFrequency'])),
                    'startDate': '2026-01-01',
                    'endDate': '2026-12-31',
                    'estimatedLoadFactor': round(min(98, route['avgLoadFactor'])),
                    'isCharter': False,
                    'isBaseline': True,
                    'historicalData': {
                        'avgPassengers': route['avgPassengersPerFlight'],
                        'avgLoadFactor': route['avgLoadFactor'],
                        'stdDevLoadFactor': route.get('stdDevLoadFactor', 0),
                        'minLoadFactor': route.get('minLoadFactor', 0),
                        'maxLoadFactor': route.get('maxLoadFactor', 100),
                        'totalFlights2025': route['totalFlights'],
                        'aircraftCapacity': route.get('aircraftCapacity', 180),
                    }
                })
        
        # Add new routes (avoiding duplicates with baseline)
        for route in new_routes:
            route_key = f"{route.get('destination', '')}-{route.get('airlineIcao', '')}-{route.get('aircraftType', '')}"
            if route_key not in baseline_route_keys:
                route['isBaseline'] = False
                merged.append(route)
        
        return merged
    
    def _calculate_yearly_advanced(self, routes: List[Dict[str, Any]], year: int) -> Dict[str, Any]:
        """Calculate yearly totals with confidence intervals."""
        total_operations = 0
        total_passengers = 0
        total_capacity = 0
        
        passenger_estimates = []
        
        for route in routes:
            operations = self._calculate_route_operations(route)
            aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
            
            # Use historical data if available
            if route.get('historicalData'):
                hist = route['historicalData']
                load_factor = hist['avgLoadFactor'] / 100.0
                # Add growth factor for baseline routes (5% optimistic growth)
                load_factor = min(0.98, load_factor * 1.05)
            else:
                load_factor = route['estimatedLoadFactor'] / 100.0
                if route.get('isCharter', False) and load_factor < 0.90:
                    load_factor = max(load_factor, 0.92)
            
            passengers = operations * aircraft_capacity * load_factor
            passenger_estimates.append(passengers)
            
            total_operations += operations
            total_passengers += passengers
            total_capacity += operations * aircraft_capacity
        
        avg_load_factor = (total_passengers / total_capacity * 100) if total_capacity > 0 else 0
        
        # Calculate confidence intervals
        if len(passenger_estimates) > 1:
            std_dev = statistics.stdev(passenger_estimates)
            confidence_95 = 1.96 * std_dev / math.sqrt(len(passenger_estimates))
        else:
            confidence_95 = 0
        
        return {
            'totalOperations': int(total_operations),
            'totalPassengers': int(total_passengers),
            'averageLoadFactor': round(avg_load_factor, 2),
            'totalCapacity': int(total_capacity),
            'confidence95Interval': {
                'lower': int(max(0, total_passengers - confidence_95)),
                'upper': int(total_passengers + confidence_95),
            }
        }
    
    def _calculate_quarterly_advanced(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate quarterly projections."""
        quarters = [
            {'name': 'Q1', 'months': [1, 2, 3]},
            {'name': 'Q2', 'months': [4, 5, 6]},
            {'name': 'Q3', 'months': [7, 8, 9]},
            {'name': 'Q4', 'months': [10, 11, 12]},
        ]
        
        quarterly_data = []
        for quarter in quarters:
            total_ops = 0
            total_pax = 0
            total_cap = 0
            
            for route in routes:
                ops, pax, cap = self._calculate_route_for_period(
                    route, year, quarter['months'][0], quarter['months'][-1]
                )
                total_ops += ops
                total_pax += pax
                total_cap += cap
            
            avg_lf = (total_pax / total_cap * 100) if total_cap > 0 else 0
            
            quarterly_data.append({
                'quarter': quarter['name'],
                'operations': int(total_ops),
                'passengers': int(total_pax),
                'loadFactor': round(avg_lf, 2),
            })
        
        return quarterly_data
    
    def _calculate_monthly_advanced(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate monthly projections with variance."""
        monthly_data = []
        
        for month in range(1, 13):
            total_ops = 0
            total_pax = 0
            total_cap = 0
            
            for route in routes:
                ops, pax, cap = self._calculate_route_for_period(route, year, month, month)
                total_ops += ops
                total_pax += pax
                total_cap += cap
            
            avg_lf = (total_pax / total_cap * 100) if total_cap > 0 else 0
            
            monthly_data.append({
                'month': month,
                'monthName': datetime(year, month, 1).strftime('%B'),
                'operations': int(total_ops),
                'passengers': int(total_pax),
                'loadFactor': round(avg_lf, 2),
            })
        
        return monthly_data
    
    def _calculate_seasonal_advanced(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate seasonal projections."""
        seasons = [
            {'name': 'Winter', 'months': [1, 2, 3]},
            {'name': 'Spring', 'months': [4, 5, 6]},
            {'name': 'Summer', 'months': [7, 8, 9]},
            {'name': 'Autumn', 'months': [10, 11, 12]},
        ]
        
        seasonal_data = []
        for season in seasons:
            total_ops = 0
            total_pax = 0
            total_cap = 0
            
            for route in routes:
                ops, pax, cap = self._calculate_route_for_period(
                    route, year, season['months'][0], season['months'][-1]
                )
                total_ops += ops
                total_pax += pax
                total_cap += cap
            
            avg_lf = (total_pax / total_cap * 100) if total_cap > 0 else 0
            
            seasonal_data.append({
                'season': season['name'],
                'operations': int(total_ops),
                'passengers': int(total_pax),
                'loadFactor': round(avg_lf, 2),
            })
        
        return seasonal_data
    
    def _calculate_route_breakdown_advanced(self, routes: List[Dict[str, Any]], total_operations: int) -> List[Dict[str, Any]]:
        """Calculate detailed route breakdown."""
        breakdown = []
        
        for route in routes:
            operations = self._calculate_route_operations(route)
            aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
            
            if route.get('historicalData'):
                hist = route['historicalData']
                load_factor = hist['avgLoadFactor'] / 100.0 * 1.05  # 5% growth
            else:
                load_factor = route['estimatedLoadFactor'] / 100.0
                if route.get('isCharter', False) and load_factor < 0.90:
                    load_factor = max(load_factor, 0.92)
            
            passengers = operations * aircraft_capacity * load_factor
            contribution = (operations / total_operations * 100) if total_operations > 0 else 0
            
            route_type = '🛫 Charter' if route.get('isCharter', False) else ('📊 Baseline' if route.get('isBaseline', False) else '🆕 Nova')
            destination_label = f"{route['destination']} ({route_type})"
            
            breakdown.append({
                'destination': destination_label,
                'airline': route['airlineIcao'],
                'operations': int(operations),
                'passengers': int(passengers),
                'loadFactor': round(load_factor * 100, 2),
                'contribution': round(contribution, 2),
                'isBaseline': route.get('isBaseline', False),
                'isCharter': route.get('isCharter', False),
            })
        
        breakdown.sort(key=lambda x: x['operations'], reverse=True)
        return breakdown
    
    def _calculate_statistics(self, routes: List[Dict[str, Any]], year: int) -> Dict[str, Any]:
        """Calculate statistical measures."""
        operations_list = []
        passengers_list = []
        load_factors = []
        
        for route in routes:
            ops = self._calculate_route_operations(route)
            cap = self._get_aircraft_capacity(route['aircraftType'])
            
            if route.get('historicalData'):
                lf = route['historicalData']['avgLoadFactor'] / 100.0 * 1.05
            else:
                lf = route['estimatedLoadFactor'] / 100.0
            
            pax = ops * cap * lf
            
            operations_list.append(ops)
            passengers_list.append(pax)
            load_factors.append(lf * 100)
        
        return {
            'operations': {
                'mean': round(statistics.mean(operations_list), 2) if operations_list else 0,
                'median': round(statistics.median(operations_list), 2) if operations_list else 0,
                'stdDev': round(statistics.stdev(operations_list), 2) if len(operations_list) > 1 else 0,
                'min': int(min(operations_list)) if operations_list else 0,
                'max': int(max(operations_list)) if operations_list else 0,
            },
            'passengers': {
                'mean': round(statistics.mean(passengers_list), 2) if passengers_list else 0,
                'median': round(statistics.median(passengers_list), 2) if passengers_list else 0,
                'stdDev': round(statistics.stdev(passengers_list), 2) if len(passengers_list) > 1 else 0,
                'min': int(min(passengers_list)) if passengers_list else 0,
                'max': int(max(passengers_list)) if passengers_list else 0,
            },
            'loadFactor': {
                'mean': round(statistics.mean(load_factors), 2) if load_factors else 0,
                'median': round(statistics.median(load_factors), 2) if load_factors else 0,
                'stdDev': round(statistics.stdev(load_factors), 2) if len(load_factors) > 1 else 0,
                'min': round(min(load_factors), 2) if load_factors else 0,
                'max': round(max(load_factors), 2) if load_factors else 0,
            }
        }
    
    def _calculate_scenarios(self, routes: List[Dict[str, Any]], year: int) -> Dict[str, Any]:
        """Calculate optimistic, realistic, and pessimistic scenarios."""
        scenarios = {}
        
        for scenario_name, lf_multiplier in [('pessimistic', 0.85), ('realistic', 1.0), ('optimistic', 1.15)]:
            total_ops = 0
            total_pax = 0
            total_cap = 0
            
            for route in routes:
                ops = self._calculate_route_operations(route)
                cap = self._get_aircraft_capacity(route['aircraftType'])
                
                if route.get('historicalData'):
                    lf = route['historicalData']['avgLoadFactor'] / 100.0 * 1.05
                else:
                    lf = route['estimatedLoadFactor'] / 100.0
                
                # Apply scenario multiplier
                lf = min(0.98, lf * lf_multiplier)
                
                pax = ops * cap * lf
                
                total_ops += ops
                total_pax += pax
                total_cap += ops * cap
            
            avg_lf = (total_pax / total_cap * 100) if total_cap > 0 else 0
            
            scenarios[scenario_name] = {
                'totalOperations': int(total_ops),
                'totalPassengers': int(total_pax),
                'averageLoadFactor': round(avg_lf, 2),
            }
        
        # Calculate relative error
        realistic_pax = scenarios['realistic']['totalPassengers']
        scenarios['relativeError'] = {
            'pessimistic': round(abs(scenarios['pessimistic']['totalPassengers'] - realistic_pax) / realistic_pax * 100, 2) if realistic_pax > 0 else 0,
            'optimistic': round(abs(scenarios['optimistic']['totalPassengers'] - realistic_pax) / realistic_pax * 100, 2) if realistic_pax > 0 else 0,
        }
        
        return scenarios
    
    def _calculate_route_operations(self, route: Dict[str, Any]) -> float:
        """Calculate total operations for a route."""
        start_date = datetime.strptime(route['startDate'], '%Y-%m-%d')
        end_date = datetime.strptime(route['endDate'], '%Y-%m-%d')
        
        days_active = (end_date - start_date).days + 1
        weeks_active = days_active / 7.0
        
        return route['weeklyOperations'] * weeks_active
    
    def _calculate_route_for_period(self, route: Dict[str, Any], year: int, start_month: int, end_month: int) -> tuple:
        """Calculate operations, passengers, and capacity for a route in a specific period."""
        route_start = datetime.strptime(route['startDate'], '%Y-%m-%d')
        route_end = datetime.strptime(route['endDate'], '%Y-%m-%d')
        
        period_start = datetime(year, start_month, 1)
        
        if end_month == 12:
            period_end = datetime(year, 12, 31)
        else:
            period_end = datetime(year, end_month + 1, 1) - timedelta(days=1)
        
        overlap_start = max(route_start, period_start)
        overlap_end = min(route_end, period_end)
        
        if overlap_start > overlap_end:
            return 0, 0, 0
        
        days_in_period = (overlap_end - overlap_start).days + 1
        weeks_in_period = days_in_period / 7.0
        operations = route['weeklyOperations'] * weeks_in_period
        
        aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
        
        if route.get('historicalData'):
            load_factor = route['historicalData']['avgLoadFactor'] / 100.0 * 1.05
        else:
            load_factor = route['estimatedLoadFactor'] / 100.0
            if route.get('isCharter', False) and load_factor < 0.90:
                load_factor = max(load_factor, 0.92)
        
        passengers = operations * aircraft_capacity * load_factor
        capacity = operations * aircraft_capacity
        
        return operations, passengers, capacity
    
    def _get_aircraft_capacity(self, aircraft_type: str) -> int:
        """Get aircraft capacity."""
        if self.db_path:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute('SELECT seats FROM AircraftType WHERE model = ?', (aircraft_type,))
                result = cursor.fetchone()
                conn.close()
                if result:
                    return result[0]
            except Exception:
                pass
        
        # Default capacities
        defaults = {
            'A320': 180, 'A321': 220, 'B738': 189, 'A319': 156,
            'B737': 189, 'A20N': 180, 'A21N': 220, 'E195': 132,
        }
        return defaults.get(aircraft_type, 180)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing input data'}), file=sys.stderr)
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        
        projection_year = input_data.get('projectionYear', 2026)
        routes = input_data.get('routes', [])
        baseline_data = input_data.get('baselineData')
        db_path = input_data.get('dbPath', 'prisma/dev.db')
        
        # Debug logging
        print(f"DEBUG: Projection year: {projection_year}", file=sys.stderr)
        print(f"DEBUG: Manual routes count: {len(routes)}", file=sys.stderr)
        print(f"DEBUG: Baseline data present: {baseline_data is not None}", file=sys.stderr)
        if baseline_data and baseline_data.get('routeSummary'):
            print(f"DEBUG: Baseline routes count: {len(baseline_data['routeSummary'])}", file=sys.stderr)
        
        calculator = AdvancedProjectionCalculator(db_path)
        result = calculator.calculate(projection_year, routes, baseline_data)
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'traceback': traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
