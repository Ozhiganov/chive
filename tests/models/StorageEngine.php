<?php

class StorageEngineTest extends TestCase
{

	public function setup()
	{
		$db = new CDbConnection('mysql:host='.DB_HOST.';dbname=information_schema', DB_USER, DB_PASSWORD);
		$db->charset='utf8';
		$db->active = true;
	}

	/**
	 * test whether getSupportedEngines returns an array
	 */
	public function testGetSupportedEngines()
	{
		$this->assertType('array', StorageEngine::getSupportedEngines());
	}

	/**
	 *
	 * tests whether getFormattedName formates the names correct
	 */
	public function testGetFormattedName()
	{
		$this->assertEquals('MyISAM', StorageEngine::getFormattedName('myisam'));
		$this->assertEquals('InnoDB', StorageEngine::getFormattedName('innodb'));
		$this->assertEquals('BLUB', StorageEngine::getFormattedName('blub'));
	}

	/**
	 * test whether the dbs got the right options
	 */
	public function testCheck()
	{
		$this->assertFalse(StorageEngine::check('myisam', StorageEngine::SUPPORTS_FOREIGN_KEYS));
		$this->assertTrue(StorageEngine::check('myisam', StorageEngine::SUPPORTS_DELAY_KEY_WRITE));
		$this->assertTrue(StorageEngine::check('myisam', StorageEngine::SUPPORTS_CHECKSUM));
		$this->assertTrue(StorageEngine::check('myisam', StorageEngine::SUPPORTS_PACK_KEYS));

		$this->assertTrue(StorageEngine::check('innodb', StorageEngine::SUPPORTS_FOREIGN_KEYS));
		$this->assertFalse(StorageEngine::check('innodb', StorageEngine::SUPPORTS_DELAY_KEY_WRITE));
		$this->assertFalse(StorageEngine::check('innodb', StorageEngine::SUPPORTS_CHECKSUM));
		$this->assertFalse(StorageEngine::check('innodb', StorageEngine::SUPPORTS_PACK_KEYS));

		$db_arr = array(
			'memory',
			'berkeleydb',
			'blackhole',
			'example',
			'archive',
			'csv',
			'ndbcluster',
			'federated',
			'mrg_myisam',
			'isam',	
		);

		foreach($db_arr as $db)
		{
			$this->assertFalse(StorageEngine::check($db, StorageEngine::SUPPORTS_FOREIGN_KEYS));
			$this->assertFalse(StorageEngine::check($db, StorageEngine::SUPPORTS_DELAY_KEY_WRITE));
			$this->assertFalse(StorageEngine::check($db, StorageEngine::SUPPORTS_CHECKSUM));
			$this->assertFalse(StorageEngine::check($db, StorageEngine::SUPPORTS_PACK_KEYS));
		}
	}


	/**
	 * tests some config
	 */
	public function testConfig()
	{
		$this->assertType('StorageEngine', StorageEngine::model());
		$this->assertType('array', StorageEngine::getPackKeyOptions());

		$model = StorageEngine::model();
		$this->assertType('array', $model->attributeNames());
	}

	/**
	 * tests to load an engine and checks the attributes
	 */
	public function testLoad()
	{
		$engines = array(
			'MyISAM',
			'MEMORY',
			'InnoDB',
			'BerkeleyDB',
			'BLACKHOLE',
			'EXAMPLE',
			'ARCHIVE',
			'CSV',
			'ndbcluster',
			'FEDERATED',
			'MRG_MYISAM',
			'ISAM'
			);

			foreach($engines as $engine)
			{
				$se = StorageEngine::model()->findAllByAttributes(array(
					'Engine' => $engine	
				));

				$se = $se[0];

				$this->assertType('StorageEngine', $se);
				$this->assertType('string', $se->Comment);
				$this->assertType('string', $se->Support);
			}
	}

	/**
	 * tests the return values of the getSupports* methods
	 */
	public function testSupports()
	{
		$db_arr = array(
			'MEMORY',
			'BerkeleyDB',
			'BLACKHOLE',
			'EXAMPLE',
			'ARCHIVE',
			'CSV',
			'ndbcluster',
			'FEDERATED',
			'MRG_MYISAM',
			'ISAM',	
		);

		foreach($db_arr as $db)
		{
			$se = StorageEngine::model()->findAllByAttributes(array(
				'Engine' => $db	
			));

			$this->assertFalse($se[0]->getSupportsChecksum());
			$this->assertFalse($se[0]->getSupportsPackKeys());
			$this->assertFalse($se[0]->getSupportsDelayKeyWrite());

		}

		$se = StorageEngine::model()->findAllByAttributes(array(
			'Engine' => 'MyISAM'	
			));

			$this->assertTrue($se[0]->getSupportsChecksum());
			$this->assertTrue($se[0]->getSupportsPackKeys());
			$this->assertTrue($se[0]->getSupportsDelayKeyWrite());

			$se = StorageEngine::model()->findAllByAttributes(array(
			'Engine' => 'InnoDB'	
			));

			$this->assertFalse($se[0]->getSupportsChecksum());
			$this->assertFalse($se[0]->getSupportsPackKeys());
			$this->assertFalse($se[0]->getSupportsDelayKeyWrite());
	}
}