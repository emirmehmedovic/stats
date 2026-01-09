#!/usr/bin/env python3
"""
Advanced projection calculator for airport traffic forecasting.
Handles route planning, historical data analysis, and passenger projections.
"""

import sys
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import sqlite3
from pathlib import Path

class ProjectionCalculator:
    def __init__(self):
        """Initialize the projection calculator."""
        pass
        
    def calculate_projections(self, year: int, routes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate comprehensive projections for the given year and routes.
        
        Args:
            year: Target year for projections
            routes: List of route configurations (includes baseline + manual routes)
            
        Returns:
            Dictionary containing yearly, quarterly, seasonal, and monthly projections
        """
        print(f"Calculating projections for {year} with {len(routes)} routes", file=sys.stderr)
        
        # Count baseline vs manual routes
        baseline_count = len([r for r in routes if r.get('isBaseline', False)])
        manual_count = len(routes) - baseline_count
        print(f"  Baseline routes: {baseline_count}, Manual routes: {manual_count}", file=sys.stderr)
        
        yearly_data = self._calculate_yearly(routes)
        quarterly_data = self._calculate_quarterly(routes, year)
        seasonal_data = self._calculate_seasonal(routes, year)
        monthly_data = self._calculate_monthly(routes, year)
        route_breakdown = self._calculate_route_breakdown(routes, yearly_data['totalOperations'])
        
        return {
            'yearly': yearly_data,
            'quarterly': quarterly_data,
            'seasonal': seasonal_data,
            'monthly': monthly_data,
            'routeBreakdown': route_breakdown
        }
    
    def _calculate_yearly(self, routes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate yearly totals."""
        total_operations = 0
        total_passengers = 0
        total_capacity = 0
        
        for route in routes:
            operations = self._calculate_route_operations(route)
            aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
            
            # Apply charter boost if applicable
            load_factor = route['estimatedLoadFactor'] / 100.0
            if route.get('isCharter', False) and load_factor < 0.90:
                # Charter flights typically have higher load factors
                load_factor = max(load_factor, 0.92)
            
            passengers = operations * aircraft_capacity * load_factor
            
            total_operations += operations
            total_passengers += passengers
            total_capacity += operations * aircraft_capacity
        
        avg_load_factor = (total_passengers / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            'totalOperations': int(total_operations),
            'totalPassengers': int(total_passengers),
            'averageLoadFactor': round(avg_load_factor, 2)
        }
    
    def _calculate_quarterly(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate quarterly breakdown."""
        quarters = []
        
        for q in range(1, 5):
            q_start_month = (q - 1) * 3 + 1
            q_end_month = q * 3
            
            q_operations = 0
            q_passengers = 0
            q_capacity = 0
            
            for route in routes:
                route_ops, route_pax, route_cap = self._calculate_route_for_period(
                    route, year, q_start_month, q_end_month
                )
                q_operations += route_ops
                q_passengers += route_pax
                q_capacity += route_cap
            
            q_load_factor = (q_passengers / q_capacity * 100) if q_capacity > 0 else 0
            
            quarters.append({
                'quarter': q,
                'operations': int(q_operations),
                'passengers': int(q_passengers),
                'loadFactor': round(q_load_factor, 2)
            })
        
        return quarters
    
    def _calculate_seasonal(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate seasonal breakdown (Winter, Spring, Summer, Fall)."""
        seasons = [
            {'name': 'Zima', 'months': [12, 1, 2]},
            {'name': 'Proljeće', 'months': [3, 4, 5]},
            {'name': 'Ljeto', 'months': [6, 7, 8]},
            {'name': 'Jesen', 'months': [9, 10, 11]}
        ]
        
        seasonal_data = []
        
        for season in seasons:
            s_operations = 0
            s_passengers = 0
            s_capacity = 0
            
            for month in season['months']:
                for route in routes:
                    route_ops, route_pax, route_cap = self._calculate_route_for_period(
                        route, year, month, month
                    )
                    s_operations += route_ops
                    s_passengers += route_pax
                    s_capacity += route_cap
            
            s_load_factor = (s_passengers / s_capacity * 100) if s_capacity > 0 else 0
            
            seasonal_data.append({
                'season': season['name'],
                'operations': int(s_operations),
                'passengers': int(s_passengers),
                'loadFactor': round(s_load_factor, 2)
            })
        
        return seasonal_data
    
    def _calculate_monthly(self, routes: List[Dict[str, Any]], year: int) -> List[Dict[str, Any]]:
        """Calculate monthly projections."""
        monthly_data = []
        
        for month in range(1, 13):
            total_ops = 0
            total_pax = 0
            total_cap = 0
            active_routes = 0
            
            for route in routes:
                ops, pax, cap = self._calculate_route_for_period(route, year, month, month)
                if ops > 0:
                    active_routes += 1
                total_ops += ops
                total_pax += pax
                total_cap += cap
            
            # Debug logging for November and December
            if month >= 11:
                print(f"Month {month}: {active_routes} active routes, {int(total_ops)} ops, {int(total_pax)} pax", file=sys.stderr)
            
            avg_lf = (total_pax / total_cap * 100) if total_cap > 0 else 0
            
            monthly_data.append({
                'month': month,
                'monthName': datetime(year, month, 1).strftime('%B'),
                'operations': int(total_ops),
                'passengers': int(total_pax),
                'loadFactor': round(avg_lf, 2)
            })
        
        return monthly_data
    
    def _calculate_route_breakdown(self, routes: List[Dict[str, Any]], total_operations: int) -> List[Dict[str, Any]]:
        """Calculate breakdown by route."""
        breakdown = []
        
        for route in routes:
            operations = self._calculate_route_operations(route)
            aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
            load_factor = route['estimatedLoadFactor'] / 100.0
            
            # Apply charter boost if applicable
            if route.get('isCharter', False) and load_factor < 0.90:
                load_factor = max(load_factor, 0.92)
            
            passengers = operations * aircraft_capacity * load_factor
            contribution = (operations / total_operations * 100) if total_operations > 0 else 0
            
            # Add route type indicator
            route_type = '🛫 Charter' if route.get('isCharter', False) else '✈️ Redovan'
            destination_label = f"{route['destination']} ({route_type})"
            
            breakdown.append({
                'destination': destination_label,
                'operations': int(operations),
                'passengers': int(passengers),
                'contribution': round(contribution, 2)
            })
        
        # Sort by operations descending
        breakdown.sort(key=lambda x: x['operations'], reverse=True)
        
        return breakdown
    
    def _calculate_route_operations(self, route: Dict[str, Any]) -> int:
        """Calculate total operations for a route based on weekly frequency and date range."""
        start_date = datetime.strptime(route['startDate'], '%Y-%m-%d')
        end_date = datetime.strptime(route['endDate'], '%Y-%m-%d')
        
        # Calculate number of weeks
        days_diff = (end_date - start_date).days + 1
        weeks = days_diff / 7.0
        
        # Total operations = weekly operations * number of weeks
        total_operations = route['weeklyOperations'] * weeks
        
        return int(total_operations)
    
    def _calculate_route_for_period(
        self, 
        route: Dict[str, Any], 
        year: int, 
        start_month: int, 
        end_month: int
    ) -> tuple:
        """Calculate operations, passengers, and capacity for a route in a specific period."""
        route_start = datetime.strptime(route['startDate'], '%Y-%m-%d')
        route_end = datetime.strptime(route['endDate'], '%Y-%m-%d')
        
        # Define period boundaries
        period_start = datetime(year, start_month, 1)
        
        # Calculate last day of end_month
        if end_month == 12:
            period_end = datetime(year, 12, 31)
        else:
            period_end = datetime(year, end_month + 1, 1) - timedelta(days=1)
        
        # Find overlap
        overlap_start = max(route_start, period_start)
        overlap_end = min(route_end, period_end)
        
        if overlap_start > overlap_end:
            return 0, 0, 0
        
        # Calculate operations in this period
        days_in_period = (overlap_end - overlap_start).days + 1
        weeks_in_period = days_in_period / 7.0
        operations = route['weeklyOperations'] * weeks_in_period
        
        # Calculate passengers with charter boost
        aircraft_capacity = self._get_aircraft_capacity(route['aircraftType'])
        load_factor = route['estimatedLoadFactor'] / 100.0
        
        # Apply charter boost if applicable
        if route.get('isCharter', False) and load_factor < 0.90:
            load_factor = max(load_factor, 0.92)
        
        passengers = operations * aircraft_capacity * load_factor
        capacity = operations * aircraft_capacity
        
        return operations, passengers, capacity
    
    def _get_aircraft_capacity(self, aircraft_type: str) -> int:
        """Get aircraft capacity from default values."""
        # Default capacities for common aircraft types
        defaults = {
            'A320': 180, 'A321': 220, 'A319': 156,
            'A20N': 180, 'A21N': 220, 'A32N': 180,
            'B737': 189, 'B738': 189, 'B38M': 189,
            'E190': 100, 'E195': 132,
            'CRJ9': 90, 'CRJ7': 70,
            'AT72': 70, 'AT76': 78,
            'DH8D': 78, 'DH8C': 50,
        }
        return defaults.get(aircraft_type, 180)


def main():
    """Main entry point for CLI usage."""
    if len(sys.argv) < 2:
        print("Usage: python calculate_projections.py <input_json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        
        year = input_data['year']
        routes = input_data['routes']
        
        print(f"DEBUG: Year={year}, Total routes={len(routes)}", file=sys.stderr)
        
        calculator = ProjectionCalculator()
        result = calculator.calculate_projections(year=year, routes=routes)
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'traceback': traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
