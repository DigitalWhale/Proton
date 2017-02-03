create table `migration_history` (
	major_version int not null,
    minor_version int not null,
    subversion int not null,
    date_create DATETIME not null,
    comment varchar(255)
) engine = InnoDB;


create procedure increment_migration(ma_v int, mi_v int, subv int)
	begin
		insert into `migration_history` (`major_version`, `minor_version`, `subversion`, `date_create`) values (ma_v, mi_v, subv, now());
	end;
    
create procedure select_last_migration()
	begin
		select *
        from protondb.migration_history 
        where date_create = (
			select max(date_create)
            from protondb.migration_history
            );
    end;