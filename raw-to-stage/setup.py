from setuptools import setup, find_packages

setup(
    name="raw_to_stage_etl_modules",
    version="0.1.0",
    description="Raw to Stage ETL modules",
    packages=find_packages(include=['raw_to_stage_etl*']),
)